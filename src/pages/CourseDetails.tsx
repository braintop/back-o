import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    IconButton,
    CardMedia,
    TableSortLabel
} from '@mui/material';
import { Add, ArrowBack, Edit, FileDownload, Link as LinkIcon, Delete, UploadFile } from '@mui/icons-material';
import { getCourseById, type Course } from '../firebase/coursesApi';
import { getLessonsByCourseId, deleteLesson, createLesson, type Lesson } from '../firebase/lessonsApi';
import { getUsers, getUserByUid, type User } from '../firebase/usersApi';
import { auth } from '../firebase/firebase';
import * as XLSX from 'xlsx';

export default function CourseDetails() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [uploading, setUploading] = useState(false);
    const [sortField, setSortField] = useState<'date' | 'title' | 'instructorName'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [canSeeAttendanceButton, setCanSeeAttendanceButton] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadCourseAndLessons();
        }
        loadUsers();
    }, [courseId]);

    const loadCourseAndLessons = async () => {
        if (!courseId) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const [courseData, lessonsData] = await Promise.all([
                getCourseById(courseId),
                getLessonsByCourseId(courseId)
            ]);
            
            if (courseData) {
                setCourse(courseData);

                // חישוב האם למשתמש הנוכחי יש הרשאת עריכה על הקורס
                if (auth.currentUser) {
                    try {
                        const currentUser = await getUserByUid(auth.currentUser.uid);
                        const isAdmin = currentUser?.role === 'admin';
                        const isTeacher = currentUser?.role === 'teacher';
                        const uid = auth.currentUser.uid;
                        const isOwner = courseData.createdBy === uid;
                        const isEditor = Array.isArray(courseData.editors) && courseData.editors.includes(uid);

                        setCanEdit(Boolean(isAdmin || isOwner || isEditor));
                        setCanSeeAttendanceButton(Boolean(isAdmin || isTeacher));
                    } catch (permErr) {
                        console.error('Error checking course permissions:', permErr);
                        setCanEdit(false);
                        setCanSeeAttendanceButton(false);
                    }
                } else {
                    setCanEdit(false);
                    setCanSeeAttendanceButton(false);
                }
            } else {
                setError('קורס לא נמצא');
                setCanEdit(false);
            }
            
            setLessons(lessonsData);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת נתונים');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const usersList = await getUsers();
            setUsers(usersList);
        } catch (err) {
            console.error('Error loading users for CSV import:', err);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    };

    const parseCsvDate = (value: string): Date => {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new Error('תאריך ריק');
        }

        const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const yearRaw = match[3];
            const year = parseInt(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw, 10);
            return new Date(year, month, day);
        }

        const asDate = new Date(trimmed);
        if (!isNaN(asDate.getTime())) {
            return asDate;
        }

        throw new Error(`תאריך לא תקין: ${value}`);
    };

    const handleDeleteLesson = async (lessonId?: string) => {
        if (!lessonId) return;

        const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את השיעור? לא ניתן לבטל פעולה זו.');
        if (!confirmed) return;

        try {
            await deleteLesson(lessonId);
            setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
        } catch (err: any) {
            alert(err.message || 'שגיאה במחיקת שיעור');
        }
    };

    const importLessonsFromCsv = async (csvText: string) => {
        if (!courseId) return;

        const lines = csvText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length === 0) {
            throw new Error('קובץ CSV ריק');
        }

        // שורת כותרת חובה בפורמט: date,email,issue (בסדר כלשהו)
        const headerParts = lines[0]
            .split(',')
            .map((h) => h.trim().toLowerCase());

        const dateIndex = headerParts.indexOf('date');
        const emailIndex = headerParts.indexOf('email');
        const issueIndex = headerParts.indexOf('issue');

        if (dateIndex === -1 || emailIndex === -1 || issueIndex === -1) {
            throw new Error(
                'שורת הכותרת בקובץ חייבת להכיל את העמודות: date, email, issue (באנגלית).'
            );
        }

        const startIndex = 1; // מדלגים על הכותרת

        if (users.length === 0) {
            await loadUsers();
        }

        let createdCount = 0;
        let skippedNoUser = 0;
        let skippedBadDate = 0;

        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map((p) => p.trim());
            if (parts.length <= Math.max(dateIndex, emailIndex, issueIndex)) continue;

            const email = parts[emailIndex];
            const dateStr = parts[dateIndex];
            const subject = parts[issueIndex];

            if (!email || !dateStr || !subject) continue;

            const instructor = users.find(
                (u) => u.email.toLowerCase() === email.toLowerCase()
            );

            if (!instructor) {
                skippedNoUser++;
                continue;
            }

            let date: Date;
            try {
                date = parseCsvDate(dateStr);
            } catch {
                skippedBadDate++;
                continue;
            }

            await createLesson({
                courseId,
                title: subject,
                date,
                instructorId: instructor.uid,
                instructorName: instructor.name
            });
            createdCount++;
        }

        if (createdCount === 0) {
            throw new Error(
                'לא נוצרו שיעורים מהקובץ. ודא ששורת הכותרת מכילה את העמודות: date, email, issue ושהאימיילים קיימים במערכת.'
            );
        }

        let message = `נטענו ${createdCount} שיעורים מהקובץ.`;
        if (skippedNoUser > 0 || skippedBadDate > 0) {
            message += ` דולגו ${skippedNoUser} שורות ללא מדריך מתאים ו-${skippedBadDate} שורות עם תאריך לא תקין.`;
        }
        alert(message);
    };

    const handleCsvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !courseId) return;

        const input = event.target;

        try {
            setUploading(true);
            const text = await file.text();
            await importLessonsFromCsv(text);
            await loadCourseAndLessons();
        } catch (err: any) {
            alert(err.message || 'שגיאה בטעינת השיעורים מהקובץ');
        } finally {
            setUploading(false);
            input.value = '';
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleSort = (field: 'date' | 'title' | 'instructorName') => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedLessons = useMemo(() => {
        const lessonsCopy = [...lessons];
        return lessonsCopy.sort((a, b) => {
            switch (sortField) {
                case 'title': {
                    const aTitle = a.title || '';
                    const bTitle = b.title || '';
                    return sortDirection === 'asc'
                        ? aTitle.localeCompare(bTitle)
                        : bTitle.localeCompare(aTitle);
                }
                case 'instructorName': {
                    const aName = a.instructorName || '';
                    const bName = b.instructorName || '';
                    return sortDirection === 'asc'
                        ? aName.localeCompare(bName)
                        : bName.localeCompare(aName);
                }
                case 'date':
                default: {
                    const aTime = a.date ? a.date.getTime() : 0;
                    const bTime = b.date ? b.date.getTime() : 0;
                    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
                }
            }
        });
    }, [lessons, sortField, sortDirection]);

    const exportToExcel = () => {
        if (lessons.length === 0) {
            alert('אין שיעורים לייצוא');
            return;
        }

        // הכנת הנתונים לייצוא
        const data = lessons.map((lesson) => ({
            'תאריך': formatDate(lesson.date),
            'שעת התחלה': lesson.startTime,
            'שעת סיום': lesson.endTime,
            'נושא השיעור': lesson.title,
            'תיאור': lesson.description || ''
        }));

        // יצירת workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'שיעורים');

        // התאמת רוחב העמודות
        const colWidths = [
            { wch: 12 }, // תאריך
            { wch: 12 }, // שעת התחלה
            { wch: 12 }, // שעת סיום
            { wch: 30 }, // נושא השיעור
            { wch: 50 }  // תיאור
        ];
        ws['!cols'] = colWidths;

        // שם הקובץ
        const fileName = course ? `${course.name}_שיעורים.xlsx` : 'שיעורים.xlsx';

        // הורדת הקובץ
        XLSX.writeFile(wb, fileName);
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error && !course) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/courses')}
                    sx={{ mt: 2 }}
                >
                    חזרה לקורסים
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/courses')}
                >
                    חזרה לקורסים
                </Button>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: 'row-reverse' }}>
                    {course?.imageUrl && (
                        <CardMedia
                            component="img"
                            image={course.imageUrl}
                            alt={course.name}
                            sx={{ objectFit: 'cover', borderRadius: 1, width: '50px', height: '50px' }}
                        />
                    )}
                    {course && (
                        <>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                                    {course.name}
                                </Typography>
                                {course.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        {course.description}
                                    </Typography>
                                )}
                                {course.syllabusLink && (
                                    <Button
                                        variant="text"
                                        size="small"
                                        startIcon={<LinkIcon />}
                                        href={course.syllabusLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mt: 0.5, fontSize: '0.875rem' }}
                                    >
                                        לינק לסילבוס
                                    </Button>
                                )}
                            </Box>
                            {canEdit && (
                                <>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => navigate(`/courses/${courseId}/lessons/new`)}
                                    >
                                        הוסף שיעור
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Edit />}
                                        onClick={() => navigate(`/courses/${courseId}/edit`)}
                                    >
                                        ערוך קורס
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        style={{ display: 'none' }}
                                        onChange={handleCsvFileChange}
                                    />
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<UploadFile />}
                                        onClick={handleUploadButtonClick}
                                        disabled={uploading}
                                    >
                                        טען שיעורים
                                    </Button>
                                </>
                            )}
                            {lessons.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="success"
                                    startIcon={<FileDownload />}
                                    onClick={exportToExcel}
                                >
                                    ייצא ל-Excel
                                </Button>
                            )}
                            {canSeeAttendanceButton && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() =>
                                        window.open(
                                            'https://docs.google.com/spreadsheets/d/1bF3fBiNxoG1q0vJGcacCymfzWO4BeIR4BGyINI9wGi0/edit?usp=sharing',
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                >
                                    נוכחות
                                </Button>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper>
                <TableContainer>
                    <Table sx={{ direction: 'rtl' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="right" sortDirection={sortField === 'date' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'date'}
                                        direction={sortField === 'date' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('date')}
                                    >
                                        תאריך
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={sortField === 'title' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'title'}
                                        direction={sortField === 'title' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('title')}
                                    >
                                        שם שיעור
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={sortField === 'instructorName' ? sortDirection : false}>
                                    <TableSortLabel
                                        active={sortField === 'instructorName'}
                                        direction={sortField === 'instructorName' ? sortDirection : 'asc'}
                                        onClick={() => handleSort('instructorName')}
                                    >
                                        מדריך
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">הועבר בשיעור</TableCell>
                                <TableCell align="right">פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lessons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            אין שיעורים עדיין
                                        </Typography>
                                        {canEdit && (
                                            <Button
                                                variant="outlined"
                                                startIcon={<Add />}
                                                onClick={() => navigate(`/courses/${courseId}/lessons/new`)}
                                                sx={{ mt: 2 }}
                                            >
                                                הוסף שיעור ראשון
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedLessons.map((lesson) => (
                                    <TableRow key={lesson.id} hover>
                                        <TableCell align="right">{formatDate(lesson.date)}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="medium">
                                                {lesson.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {lesson.instructorName || 'לא צוין'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                                {lesson.taughtInLesson || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {canEdit && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                                                        color="primary"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                        color="error"
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
}

