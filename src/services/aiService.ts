import { getCourses } from '../firebase/coursesApi';
import { getAllLessons } from '../firebase/lessonsApi';
import { getUsers } from '../firebase/usersApi';
import { getSharedFiles } from '../firebase/sharedFilesApi';
import { getVideoCourses } from '../firebase/videoCoursesApi';
import { getChaptersByCourseId } from '../firebase/videoChaptersApi';
import { getVideoLessonsByChapterId } from '../firebase/videoLessonsApi';

// פונקציה להכנת נתונים לשאילתה
async function prepareDataForAI() {
    try {
        const [courses, allLessons, users, sharedFiles, visibleVideoCourses] = await Promise.all([
            getCourses(),
            getAllLessons(),
            getUsers(),
            getSharedFiles(),
            getVideoCourses(true)
        ]);

        // בניית מערך שיעורי וידאו עם מידע על קורס ופרק + URL לצפייה
        const videoLessons: Array<{
            id?: string;
            courseId: string;
            courseName: string;
            chapterId: string;
            chapterTitle: string;
            title: string;
            description: string;
            viewUrl: string;
        }> = [];

        for (const course of visibleVideoCourses) {
            if (!course.id) continue;
            const chapters = await getChaptersByCourseId(course.id);
            for (const chapter of chapters) {
                if (!chapter.id) continue;
                const lessons = await getVideoLessonsByChapterId(chapter.id);
                lessons.forEach((lesson) => {
                    videoLessons.push({
                        id: lesson.id,
                        courseId: course.id!,
                        courseName: course.name,
                        chapterId: chapter.id!,
                        chapterTitle: chapter.title,
                        title: lesson.title,
                        description: lesson.description || '',
                        viewUrl: `/video-courses/view/${course.id}/${lesson.id}`
                    });
                });
            }
        }

        // הכנת נתונים בפורמט JSON
        const data = {
            courses: courses.map(course => ({
                id: course.id,
                name: course.name,
                description: course.description,
                imageUrl: course.imageUrl
            })),
            lessons: allLessons.map(lesson => ({
                id: lesson.id,
                courseId: lesson.courseId,
                title: lesson.title,
                date: lesson.date.toISOString().split('T')[0],
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                instructorName: lesson.instructorName || 'לא צוין',
                taughtInLesson: lesson.taughtInLesson || '',
                description: lesson.description || '',
                files: (lesson.files || []).map(file => ({
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    url: file.url
                }))
            })),
            instructors: users.map(user => ({
                name: user.name,
                email: user.email
            })),
            sharedFiles: sharedFiles.map(file => ({
                id: file.id,
                name: file.name,
                type: file.type,
                url: file.url,
                description: file.description || '',
                createdAt: file.createdAt.toISOString().split('T')[0],
                createdByName: file.createdByName || ''
            })),
            videoCourses: visibleVideoCourses.map(course => ({
                id: course.id,
                name: course.name,
                description: course.description,
                editorName: course.editorName,
                viewUrl: `/video-courses/view/${course.id}`
            })),
            videoLessons
        };

        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error preparing data for AI:', error);
        return '{}';
    }
}

// פונקציה לשאילתת AI
export async function askAI(question: string): Promise<string> {
    try {
        // בדיקה אם יש API key
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            return 'שגיאה: API Key לא הוגדר. אנא הוסף VITE_GEMINI_API_KEY לקובץ .env';
        }

        // הכנת נתונים
        const data = await prepareDataForAI();

        // יצירת prompt
        const prompt = `אתה עוזר AI למערכת ניהול קורסים ושיעורים בעברית.

הנתונים הזמינים:
${data}

שאלת המשתמש: "${question}"

הנחיות מענה:
- ענה בעברית בצורה ברורה וקצרה.
- אם השאלה מתייחסת לשיעור מסוים, השתמש ברשימת השיעורים (lessons או videoLessons).
- אם המשתמש מחפש קורס וידאו, השתמש ברשימת videoCourses והחזר גם שם הקורס וגם ה-URL מתוך השדה viewUrl.
- אם המשתמש רוצה שיעור וידאו ספציפי, השתמש ברשימת videoLessons והחזר גם שם הקורס, שם הפרק, שם השיעור וה-URL מתוך viewUrl.
- אם המשתמש מבקש מצגת / PDF / וידאו / קובץ לשיעור פרונטלי, חפש תחילה בקבצים של אותו שיעור (lesson.files).
- אם לא נמצא שם, חפש ברשימת הקבצים המשותפים (sharedFiles).
- החזר קישורים ישירים (URL) בפורמט קריא, למשל:
  - "קורס וידאו: /video-courses/view/..."
  - "שיעור וידאו: /video-courses/view/.../..."
  - "מצגת: https://..."
  - "דף עבודה: https://..."
  - "וידאו: https://..."
- אם אין קובץ מתאים או קורס/שיעור מתאים, כתוב במפורש שאין כזה במערכת.
- אם אין נתונים רלוונטיים בכלל, אמור זאת בצורה מנומסת.

תשובה:`;

        // שימוש ב-API ישירות
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        // נבדוק את המודלים הזמינים קודם
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        let availableModel = 'gemini-pro'; // ברירת מחדל
        
        try {
            const modelsResponse = await fetch(listModelsUrl);
            if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                if (modelsData.models && modelsData.models.length > 0) {
                    // נחפש מודל שתמוך ב-generateContent
                    const supportedModel = modelsData.models.find((m: any) => 
                        m.supportedGenerationMethods?.includes('generateContent')
                    );
                    if (supportedModel) {
                        // נסיר את הקידומת models/ אם יש
                        availableModel = supportedModel.name.replace('models/', '');
                        console.log('נמצא מודל זמין:', availableModel);
                    }
                }
            }
        } catch (e) {
            console.warn('לא ניתן לקבל רשימת מודלים, נשתמש ב-gemini-pro');
        }
        
        // ננסה עם המודל שנמצא
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${availableModel}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}. נסה לבדוק את המודלים הזמינים ב-Google AI Studio.`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error('תשובה לא תקינה מה-API');
        }
    } catch (error: any) {
        console.error('Error asking AI:', error);
        return `שגיאה בקבלת תשובה: ${error.message || 'שגיאה לא ידועה'}`;
    }
}


