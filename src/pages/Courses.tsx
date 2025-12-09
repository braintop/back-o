import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Alert,
    CardMedia,
    IconButton,
    Tooltip
} from '@mui/material';
import { Add, FileDownload, Delete } from '@mui/icons-material';
import { getCourses, deleteCourse, type Course } from '../firebase/coursesApi';
import { getLessonsByCourseId, type Lesson } from '../firebase/lessonsApi';
import * as XLSX from 'xlsx';
import { auth } from '../firebase/firebase';
import { getUserByUid } from '../firebase/usersApi';

export default function Courses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

    useEffect(() => {
        const checkAccessAndLoad = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate('/login');
                    return;
                }

                const currentUser = await getUserByUid(user.uid);
                if (currentUser?.role !== 'admin') {
                    navigate('/front-lessons');
                    return;
                }

                await loadCourses();
            } catch (err: any) {
                console.error('שגיאה בבדיקת הרשאות לניהול קורסים פרונטליים:', err);
                navigate('/front-lessons');
            } finally {
                setCheckingAccess(false);
            }
        };

        checkAccessAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const coursesData = await getCourses();
            setCourses(coursesData);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת קורסים');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    };

    const exportAllLessonsToExcel = async () => {
        if (courses.length === 0) {
            alert('אין קורסים לייצוא');
            return;
        }

        try {
            setExporting(true);
            setError(null);

            // איסוף כל השיעורים מכל הקורסים
            const allLessons: Array<Lesson & { courseName: string }> = [];
            
            for (const course of courses) {
                if (course.id) {
                    try {
                        const lessons = await getLessonsByCourseId(course.id);
                        const lessonsWithCourseName = lessons.map(lesson => ({
                            ...lesson,
                            courseName: course.name
                        }));
                        allLessons.push(...lessonsWithCourseName);
                    } catch (err) {
                        console.error(`שגיאה בטעינת שיעורים לקורס ${course.name}:`, err);
                    }
                }
            }

            if (allLessons.length === 0) {
                alert('אין שיעורים לייצוא');
                return;
            }

            // הכנת הנתונים לייצוא
            const data = allLessons.map((lesson) => ({
                'קורס': lesson.courseName,
                'תאריך': formatDate(lesson.date),
                'שעת התחלה': lesson.startTime,
                'שעת סיום': lesson.endTime,
                'נושא השיעור': lesson.title,
                'תיאור': lesson.description || ''
            }));

            // יצירת workbook
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'כל השיעורים');

            // התאמת רוחב העמודות
            const colWidths = [
                { wch: 20 }, // קורס
                { wch: 12 }, // תאריך
                { wch: 12 }, // שעת התחלה
                { wch: 12 }, // שעת סיום
                { wch: 30 }, // נושא השיעור
                { wch: 50 }  // תיאור
            ];
            ws['!cols'] = colWidths;

            // שם הקובץ
            const fileName = `כל_השיעורים_${new Date().toISOString().split('T')[0]}.xlsx`;

            // הורדת הקובץ
            XLSX.writeFile(wb, fileName);
        } catch (err: any) {
            setError(err.message || 'שגיאה בייצוא השיעורים');
            alert('שגיאה בייצוא השיעורים: ' + (err.message || 'שגיאה לא ידועה'));
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteCourse = async (course: Course) => {
        if (!course.id) return;

        try {
            setError(null);
            setDeletingCourseId(course.id);

            const lessons = await getLessonsByCourseId(course.id);
            if (lessons.length > 0) {
                alert('לא ניתן למחוק קורס שיש לו שיעורים. מחק קודם את כל השיעורים של הקורס.');
                return;
            }

            const confirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את הקורס "${course.name}"? פעולה זו אינה הפיכה.`);
            if (!confirmed) {
                return;
            }

            await deleteCourse(course.id);
            setCourses(prev => prev.filter(c => c.id !== course.id));
        } catch (err: any) {
            console.error('שגיאה במחיקת קורס:', err);
            setError(err.message || 'שגיאה במחיקת קורס');
        } finally {
            setDeletingCourseId(null);
        }
    };

    if (checkingAccess || loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4, direction: 'rtl' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: 'row-reverse' }}>
                <Typography variant="h4" component="h1">
                    קורסים
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {courses.length > 0 && (
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<FileDownload />}
                            onClick={exportAllLessonsToExcel}
                            disabled={exporting}
                        >
                            {exporting ? 'מייצא...' : 'ייצא כל השיעורים'}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/courses/new')}
                    >
                        קורס חדש
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        אין קורסים עדיין
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/courses/new')}
                    >
                        צור קורס ראשון
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ direction: 'rtl' }}>
                    {courses.map((course) => (
                        // @ts-expect-error - MUI v7 Grid types issue
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate(`/courses/${course.id}`)}>
                                {course.imageUrl && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={course.imageUrl}
                                        alt={course.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h2" gutterBottom>
                                        {course.name}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/courses/${course.id}`);
                                        }}
                                    >
                                        צפה בקורס
                                    </Button>
                                    <Tooltip title="מחק קורס">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCourse(course);
                                                }}
                                                disabled={deletingCourseId === course.id}
                                                color="error"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}

