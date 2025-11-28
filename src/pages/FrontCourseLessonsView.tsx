import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Paper,
    CardMedia,
    List,
    ListItemButton,
    ListItemText,
    Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCourseById, type Course } from '../firebase/coursesApi';
import { getLessonsByCourseId, type Lesson } from '../firebase/lessonsApi';

export default function FrontCourseLessonsView() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!courseId) return;
            try {
                setLoading(true);
                setError(null);
                const [courseData, lessonsData] = await Promise.all([
                    getCourseById(courseId),
                    getLessonsByCourseId(courseId)
                ]);
                if (!courseData) {
                    setError('קורס לא נמצא');
                    return;
                }
                setCourse(courseData);
                setLessons(lessonsData);
            } catch (err: any) {
                setError(err.message || 'שגיאה בטעינת הקורס והשיעורים');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [courseId]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error && !course) {
        return (
            <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/front-lessons')}
                    sx={{ mt: 2 }}
                >
                    חזרה לרשימת הקורסים
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/front-lessons')}
                >
                    חזרה לרשימת הקורסים
                </Button>
                {course && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: 'row-reverse' }}>
                        {course.imageUrl && (
                            <CardMedia
                                component="img"
                                image={course.imageUrl}
                                alt={course.name}
                                sx={{ objectFit: 'cover', borderRadius: 1, width: 50, height: 50 }}
                            />
                        )}
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                                {course.name}
                            </Typography>
                            {course.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {course.description}
                                </Typography>
                            )}
                            {course.syllabusLink && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    סילבוס הקורס:{' '}
                                    <a href={course.syllabusLink} target="_blank" rel="noopener noreferrer">
                                        לצפייה בסילבוס לחץ כאן
                                    </a>
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {error && course && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2 }}>
                {lessons.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                        אין שיעורים בקורס זה עדיין.
                    </Typography>
                ) : (
                    <>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            שיעורים בקורס
                        </Typography>
                        <List>
                            {lessons.map((lesson) => (
                                <Box key={lesson.id}>
                                    <ListItemButton
                                        selected={selectedLessonId === lesson.id}
                                        onClick={() =>
                                            setSelectedLessonId(
                                                selectedLessonId === lesson.id ? null : (lesson.id as string)
                                            )
                                        }
                                        sx={{ display: 'flex', gap: 2 }}
                                    >
                                        <ListItemText primary={formatDate(lesson.date)} sx={{ maxWidth: 110 }} />
                                        <ListItemText
                                            primary={lesson.instructorName || ''}
                                            sx={{ maxWidth: 160 }}
                                        />
                                        <ListItemText primary={lesson.title} sx={{ maxWidth: 260 }} />
                                        <ListItemText primary={lesson.taughtInLesson || ''} />
                                    </ListItemButton>
                                    {selectedLessonId === lesson.id && (
                                        <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
                                            {lesson.description && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                        תיאור השיעור:
                                                    </Typography>
                                                    <Box
                                                        className="ProseMirror"
                                                        dir="rtl"
                                                        sx={{
                                                            '& a': {
                                                                color: '#1976d2',
                                                                textDecoration: 'underline'
                                                            }
                                                        }}
                                                        dangerouslySetInnerHTML={{
                                                            __html: (lesson.description as any) || ''
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            {lesson.files && lesson.files.length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        קבצים מהשיעור:
                                                    </Typography>
                                                    <List dense>
                                                        {lesson.files.map((file) => (
                                                            <ListItemText
                                                                key={file.id}
                                                                primary={
                                                                    <>
                                                                        <a
                                                                            href={file.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            {file.name}
                                                                        </a>
                                                                        {file.note && (
                                                                            <Typography
                                                                                component="span"
                                                                                variant="caption"
                                                                                color="text.secondary"
                                                                                sx={{ ml: 1 }}
                                                                            >
                                                                                – {file.note}
                                                                            </Typography>
                                                                        )}
                                                                    </>
                                                                }
                                                            />
                                                        ))}
                                                    </List>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Divider />
                                </Box>
                            ))}
                        </List>
                    </>
                )}
            </Paper>
        </Container>
    );
}


