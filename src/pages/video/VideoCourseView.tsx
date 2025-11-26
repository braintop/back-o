import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Paper
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import {
    getVideoCourseById,
    type VideoCourse
} from '../../firebase/videoCoursesApi';
import {
    getChaptersByCourseId,
    type VideoChapter
} from '../../firebase/videoChaptersApi';
import {
    getVideoLessonsByChapterId,
    type VideoLesson
} from '../../firebase/videoLessonsApi';

interface ChapterWithLessons extends VideoChapter {
    lessons: VideoLesson[];
}

const getYoutubeEmbed = (url: string): string | null => {
    if (!url) return null;
    let u = url.trim();
    if (u.includes('youtube.com/embed/')) return u.split('?')[0];
    if (u.includes('youtube.com/watch?v=')) {
        const id = u.split('v=')[1]?.split('&')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.includes('youtu.be/')) {
        const id = u.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
};

const getVimeoEmbed = (url: string): string | null => {
    if (!url) return null;
    let u = url.trim();
    if (u.includes('player.vimeo.com/video/')) return u.split('?')[0];
    if (u.includes('vimeo.com/')) {
        const parts = u.split('vimeo.com/')[1]?.split('?')[0]?.split('/') || [];
        const id = parts.find((p) => /^\d+$/.test(p));
        return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
};

export default function VideoCourseView() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<VideoCourse | null>(null);
    const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<VideoLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            setError(null);

            const coursePromise = getVideoCourseById(courseId);
            const chaptersPromise = getChaptersByCourseId(courseId);

            const [courseData, chaptersData] = await Promise.all([
                coursePromise,
                chaptersPromise
            ]);

            if (!courseData) {
                setError('קורס וידאו לא נמצא');
                setCourse(null);
                setChapters([]);
                setSelectedLesson(null);
                return;
            }

            setCourse(courseData);

            const chaptersWithLessons: ChapterWithLessons[] = [];

            for (const chapter of chaptersData) {
                const lessons = await getVideoLessonsByChapterId(chapter.id!);
                chaptersWithLessons.push({
                    ...chapter,
                    lessons
                });
            }

            setChapters(chaptersWithLessons);

            // בוחרים אוטומטית שיעור ראשון אם קיים
            const firstChapter = chaptersWithLessons[0];
            const firstLesson = firstChapter?.lessons[0] || null;
            setSelectedLesson(firstLesson || null);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת נתוני הקורס');
        } finally {
            setLoading(false);
        }
    };

    const renderVideo = (lesson: VideoLesson) => {
        const yt = lesson.youtubeUrl ? getYoutubeEmbed(lesson.youtubeUrl as any) : null;
        const vm = !yt && lesson.vimeoUrl ? getVimeoEmbed(lesson.vimeoUrl as any) : null;
        const src = yt || vm;
        if (!src) return null;

        return (
            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, mt: 2 }}>
                <iframe
                    src={src}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </Box>
        );
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
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/video-courses/view')}
                    sx={{ mt: 2 }}
                >
                    חזרה לרשימת קורסי וידאו
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/video-courses/view')}
                >
                    חזרה לקורסים
                </Button>
                {course && (
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                            {course.name}
                        </Typography>
                        {course.description && (
                            <Typography variant="body2" color="text.secondary">
                                {course.description}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row-reverse' },
                    gap: 3,
                    alignItems: 'flex-start'
                }}
            >
                {/* תפריט פרקים ושיעורים מימין */}
                <Box
                    sx={{
                        width: { xs: '100%', md: 320 },
                        flexShrink: 0
                    }}
                >
                    <Paper sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            פרקים ושיעורים
                        </Typography>
                        {chapters.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                אין פרקים בקורס זה עדיין.
                            </Typography>
                        ) : (
                            <List sx={{ width: '100%' }}>
                                {chapters.map((chapter) => (
                                    <Box key={chapter.id} sx={{ mb: 1 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}
                                        >
                                            {chapter.title}
                                        </Typography>
                                        {chapter.lessons.map((lesson) => (
                                            <ListItemButton
                                                key={lesson.id}
                                                selected={selectedLesson?.id === lesson.id}
                                                onClick={() => setSelectedLesson(lesson)}
                                                sx={{ pl: 2 }}
                                            >
                                                <ListItemText
                                                    primary={lesson.title}
                                                    primaryTypographyProps={{ sx: { textAlign: 'right' } }}
                                                />
                                            </ListItemButton>
                                        ))}
                                        <Divider sx={{ my: 1 }} />
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>

                {/* תוכן השיעור משמאל – תופס את כל הרוחב שנותר */}
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <Paper sx={{ p: 3, minHeight: '60vh' }}>
                        {!selectedLesson ? (
                            <Typography variant="body1" color="text.secondary">
                                בחר שיעור מהרשימה בצד ימין כדי להתחיל לצפות.
                            </Typography>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {selectedLesson.title}
                                    </Typography>
                                    <PlayCircleOutlineIcon color="primary" />
                                </Box>
                                {selectedLesson.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {selectedLesson.description}
                                    </Typography>
                                )}

                                {renderVideo(selectedLesson)}

                                {selectedLesson.richText && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            תיאור מפורט
                                        </Typography>
                                        <Box
                                            sx={{
                                                '& h1, & h2, & h3, & p, & li': {
                                                    direction: 'rtl',
                                                    textAlign: 'right'
                                                }
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: (selectedLesson as any).richText || ''
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}


