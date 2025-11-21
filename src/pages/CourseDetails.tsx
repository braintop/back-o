import { useEffect, useState } from 'react';
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
    Rating,
    IconButton,
    CardMedia
} from '@mui/material';
import { Add, ArrowBack, Edit, FileDownload } from '@mui/icons-material';
import { getCourseById, type Course } from '../firebase/coursesApi';
import { getLessonsByCourseId, type Lesson } from '../firebase/lessonsApi';
import * as XLSX from 'xlsx';

export default function CourseDetails() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (courseId) {
            loadCourseAndLessons();
        }
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
            } else {
                setError('קורס לא נמצא');
            }
            
            setLessons(lessonsData);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת נתונים');
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
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/courses/${courseId}/edit`)}
                    >
                        ערוך קורס
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate(`/courses/${courseId}/lessons/new`)}
                    >
                        הוסף שיעור
                    </Button>
                </Box>
            </Box>

            {course && (
                <Paper sx={{ p: 3, mb: 4 }}>
                    {course.imageUrl && (
                        <Box sx={{ mb: 3 }}>
                            <CardMedia
                                component="img"
                                height="300"
                                image={course.imageUrl}
                                alt={course.name}
                                sx={{ objectFit: 'cover', borderRadius: 2 }}
                            />
                        </Box>
                    )}
                    <Typography variant="h4" component="h1" gutterBottom>
                        {course.name}
                    </Typography>
                    {course.description && (
                        <Typography variant="body1" color="text.secondary">
                            {course.description}
                        </Typography>
                    )}
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>תאריך</TableCell>
                                <TableCell>שם שיעור</TableCell>
                                <TableCell>שעות</TableCell>
                                <TableCell>מדריך</TableCell>
                                <TableCell>תיאור</TableCell>
                                <TableCell>דירוג</TableCell>
                                <TableCell>פעולות</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lessons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            אין שיעורים עדיין
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Add />}
                                            onClick={() => navigate(`/courses/${courseId}/lessons/new`)}
                                            sx={{ mt: 2 }}
                                        >
                                            הוסף שיעור ראשון
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lessons.map((lesson) => (
                                    <TableRow key={lesson.id} hover>
                                        <TableCell>{formatDate(lesson.date)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {lesson.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {lesson.startTime} - {lesson.endTime}
                                        </TableCell>
                                        <TableCell>
                                            {lesson.instructorName || 'לא צוין'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                                {lesson.description || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {lesson.rating ? (
                                                <Rating value={lesson.rating} readOnly size="small" />
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                                                color="primary"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
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

