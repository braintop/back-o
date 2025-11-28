import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    ArrowBack,
    Add,
    Edit,
    Delete,
    ExpandMore
} from '@mui/icons-material';
import {
    getVideoCourseById,
    updateVideoCourse,
    type VideoCourse
} from '../../firebase/videoCoursesApi';
import {
    getChaptersByCourseId,
    createVideoChapter,
    updateVideoChapter,
    deleteVideoChapter,
    type VideoChapter
} from '../../firebase/videoChaptersApi';
import {
    getVideoLessonsByChapterId,
    createVideoLesson,
    updateVideoLesson,
    deleteVideoLesson,
    type VideoLesson
} from '../../firebase/videoLessonsApi';
import { auth } from '../../firebase/firebase';
import { getUserByUid } from '../../firebase/usersApi';
import RichTextEditor from '../../components/RichTextEditor';

interface ChapterWithLessons extends VideoChapter {
    lessons: VideoLesson[];
}

export default function VideoCourseDetails() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<VideoCourse | null>(null);
    const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<VideoChapter | null>(null);
    const [chapterTitle, setChapterTitle] = useState('');

    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [currentChapterForLesson, setCurrentChapterForLesson] = useState<VideoChapter | null>(null);
    const [editingLesson, setEditingLesson] = useState<VideoLesson | null>(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        description: '',
        richText: '',
        vimeoUrl: '',
        youtubeUrl: ''
    });
    const [syllabusDialogOpen, setSyllabusDialogOpen] = useState(false);
    const [syllabusLink, setSyllabusLink] = useState('');
    const [coursePresentationDialogOpen, setCoursePresentationDialogOpen] = useState(false);
    const [coursePresentationLink, setCoursePresentationLink] = useState('');

    useEffect(() => {
        const checkAdminAndLoad = async () => {
            if (!courseId) return;
            if (!auth.currentUser) {
                setIsAdmin(false);
                navigate('/video-courses/view');
                return;
            }
            try {
                const current = await getUserByUid(auth.currentUser.uid);
                if (current?.role === 'admin') {
                    setIsAdmin(true);
                    await loadData();
                } else {
                    setIsAdmin(false);
                    navigate('/video-courses/view');
                }
            } catch (err) {
                console.error('Error determining admin role for video course details:', err);
                setIsAdmin(false);
                navigate('/video-courses/view');
            }
        };

        checkAdminAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                return;
            }

            setCourse(courseData);
            setSyllabusLink(courseData.syllabusLink || '');
            setCoursePresentationLink((courseData as any).coursePresentationLink || '');

            const chaptersWithLessons: ChapterWithLessons[] = [];

            for (const chapter of chaptersData) {
                const lessons = await getVideoLessonsByChapterId(chapter.id!);
                chaptersWithLessons.push({
                    ...chapter,
                    lessons
                });
            }

            setChapters(chaptersWithLessons);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת נתוני הקורס');
        } finally {
            setLoading(false);
        }
    };

    const openNewChapterDialog = () => {
        setEditingChapter(null);
        setChapterTitle('');
        setChapterDialogOpen(true);
    };

    const openEditChapterDialog = (chapter: VideoChapter) => {
        setEditingChapter(chapter);
        setChapterTitle(chapter.title);
        setChapterDialogOpen(true);
    };

    const handleSaveChapter = async () => {
        if (!courseId || !chapterTitle.trim()) return;

        try {
            if (editingChapter && editingChapter.id) {
                await updateVideoChapter(editingChapter.id, { title: chapterTitle.trim() });
            } else {
                const order = chapters.length + 1;
                await createVideoChapter({
                    courseId,
                    title: chapterTitle.trim(),
                    order
                });
            }
            setChapterDialogOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'שגיאה בשמירת פרק');
        }
    };

    const handleDeleteChapter = async (chapter: ChapterWithLessons) => {
        if (!chapter.id) return;
        const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את הפרק וכל שיעוריו?');
        if (!confirmed) return;

        try {
            // מחיקת כל השיעורים של הפרק
            for (const lesson of chapter.lessons) {
                if (lesson.id) {
                    await deleteVideoLesson(lesson.id);
                }
            }
            await deleteVideoChapter(chapter.id);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'שגיאה במחיקת פרק');
        }
    };

    const openNewLessonDialog = (chapter: VideoChapter) => {
        setCurrentChapterForLesson(chapter);
        setEditingLesson(null);
        setLessonForm({
            title: '',
            description: '',
            richText: '',
            vimeoUrl: '',
            youtubeUrl: ''
        });
        setLessonDialogOpen(true);
    };

    const openEditLessonDialog = (chapter: VideoChapter, lesson: VideoLesson) => {
        setCurrentChapterForLesson(chapter);
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title || '',
            description: lesson.description || '',
            richText: (lesson as any).richText || '',
            vimeoUrl: (lesson as any).vimeoUrl || '',
            youtubeUrl: (lesson as any).youtubeUrl || ''
        });
        setLessonDialogOpen(true);
    };

    const handleLessonFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLessonForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveLesson = async () => {
        if (!courseId || !currentChapterForLesson?.id || !lessonForm.title.trim()) return;

        try {
            const baseData = {
                courseId,
                chapterId: currentChapterForLesson.id,
                title: lessonForm.title.trim(),
                description: lessonForm.description.trim() || undefined,
                richText: lessonForm.richText || undefined,
                vimeoUrl: lessonForm.vimeoUrl.trim() || undefined,
                youtubeUrl: lessonForm.youtubeUrl.trim() || undefined
            };

            if (editingLesson && editingLesson.id) {
                await updateVideoLesson(editingLesson.id, baseData as any);
            } else {
                const chapter = chapters.find((c) => c.id === currentChapterForLesson.id);
                const order = (chapter?.lessons.length || 0) + 1;
                await createVideoLesson({
                    ...baseData,
                    order
                });
            }

            setLessonDialogOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'שגיאה בשמירת שיעור');
        }
    };

    const handleDeleteLesson = async (lesson: VideoLesson) => {
        if (!lesson.id) return;
        const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את השיעור?');
        if (!confirmed) return;

        try {
            await deleteVideoLesson(lesson.id);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'שגיאה במחיקת שיעור');
        }
    };

    if (isAdmin === null || loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!isAdmin) {
        return null;
    }

    if (error && !course) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/video-courses')}
                    sx={{ mt: 2 }}
                >
                    חזרה לקורסי וידאו
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} dir="rtl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/video-courses')}
                >
                    חזרה לקורסי וידאו
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
                        {course.syllabusLink && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                סילבוס הקורס:{' '}
                                <a href={course.syllabusLink} target="_blank" rel="noopener noreferrer">
                                    לצפייה בסילבוס לחץ כאן
                                </a>
                            </Typography>
                        )}
                        {(course as any).coursePresentationLink && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                מצגת הקורס:{' '}
                                <a
                                    href={(course as any).coursePresentationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    לצפייה במצגת לחץ כאן
                                </a>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setSyllabusDialogOpen(true)}
                    >
                        נהל סילבוס
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setCoursePresentationDialogOpen(true)}
                    >
                        מצגת הקורס
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openNewChapterDialog}
                    >
                        הוסף פרק
                    </Button>
                </Box>
            </Box>

            {chapters.length === 0 ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" align="center">
                        אין פרקים בקורס עדיין. לחץ על "הוסף פרק" כדי להתחיל.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {chapters.map((chapter, index) => (
                        // @ts-expect-error - MUI v7 Grid types issue
                        <Grid item xs={12} key={chapter.id}>
                            <Accordion defaultExpanded>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    sx={{ flexDirection: 'row-reverse' }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            gap: 2,
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <Typography variant="h6">
                                            פרק {index + 1}. {chapter.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: חיבור למצגת שיעור
                                                }}
                                            >
                                                מצגת שיעור
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: חיבור לשיעורי בית
                                                }}
                                            >
                                                שיעורי בית
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: חיבור לעבודה בכיתה
                                                }}
                                            >
                                                עבודה בכיתה
                                            </Button>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                component="span"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openNewLessonDialog(chapter);
                                                }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                component="span"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditChapterDialog(chapter);
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                component="span"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteChapter(chapter);
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {chapter.lessons.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            אין שיעורים בפרק זה. לחץ על כפתור הפלוס כדי להוסיף שיעור ראשון.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {chapter.lessons.map((lesson) => (
                                                // @ts-expect-error - MUI v7 Grid types issue
                                                <Grid item xs={12} key={lesson.id}>
                                                    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ textAlign: 'right', mr: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                {lesson.title}
                                                            </Typography>
                                                            {lesson.description && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {lesson.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => openEditLessonDialog(chapter, lesson)}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteLesson(lesson)}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    ))}
                </Grid>
            )}

            {course?.introVideoUrl && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        וידאו פתיחה של הקורס
                    </Typography>
                    <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                            src={course.introVideoUrl}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </Box>
                </Box>
            )}

            {/* דיאלוג פרק */}
            <Dialog
                open={chapterDialogOpen}
                onClose={() => setChapterDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                dir="rtl"
            >
                <DialogTitle>{editingChapter ? 'עריכת פרק' : 'פרק חדש'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        label="שם הפרק"
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle(e.target.value)}
                        inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                        InputLabelProps={{ style: { direction: 'rtl' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setChapterDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleSaveChapter} variant="contained">
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג שיעור */}
            <Dialog
                open={lessonDialogOpen}
                onClose={() => setLessonDialogOpen(false)}
                fullWidth
                maxWidth="md"
                dir="rtl"
            >
                <DialogTitle>{editingLesson ? 'עריכת שיעור' : 'שיעור חדש'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        label="שם השיעור"
                        name="title"
                        value={lessonForm.title}
                        onChange={handleLessonFieldChange}
                        inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                        InputLabelProps={{ style: { direction: 'rtl' } }}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        label="תיאור קצר של השיעור"
                        name="description"
                        value={lessonForm.description}
                        onChange={handleLessonFieldChange}
                        multiline
                        rows={3}
                        inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                        InputLabelProps={{ style: { direction: 'rtl' } }}
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            תיאור מפורט (Rich Text)
                        </Typography>
                        <RichTextEditor
                            value={lessonForm.richText}
                            onChange={(value) =>
                                setLessonForm((prev) => ({
                                    ...prev,
                                    richText: value
                                }))
                            }
                            placeholder="הקלד את תוכן השיעור, כולל טקסט, קישורים ווידאו מוטמע..."
                        />
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="לינק וידאו Vimeo"
                            name="vimeoUrl"
                            value={lessonForm.vimeoUrl}
                            onChange={handleLessonFieldChange}
                            placeholder="https://vimeo.com/..."
                            type="url"
                        />
                        <TextField
                            fullWidth
                            margin="dense"
                            label="לינק וידאו YouTube"
                            name="youtubeUrl"
                            value={lessonForm.youtubeUrl}
                            onChange={handleLessonFieldChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            type="url"
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLessonDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleSaveLesson} variant="contained">
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג סילבוס */}
            <Dialog
                open={syllabusDialogOpen}
                onClose={() => setSyllabusDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                dir="rtl"
            >
                <DialogTitle>סילבוס הקורס</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="לינק לסילבוס (URL)"
                        value={syllabusLink}
                        onChange={(e) => setSyllabusLink(e.target.value)}
                        placeholder="https://..."
                        type="url"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSyllabusDialogOpen(false)}>ביטול</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!courseId) return;
                            try {
                                await updateVideoCourse(courseId, {
                                    syllabusLink: syllabusLink.trim() || undefined,
                                });
                                if (course) {
                                    setCourse({
                                        ...course,
                                        syllabusLink: syllabusLink.trim() || undefined,
                                    });
                                }
                                setSyllabusDialogOpen(false);
                            } catch (err: any) {
                                alert(err.message || 'שגיאה בשמירת הסילבוס');
                            }
                        }}
                    >
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג מצגת הקורס */}
            <Dialog
                open={coursePresentationDialogOpen}
                onClose={() => setCoursePresentationDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                dir="rtl"
            >
                <DialogTitle>מצגת הקורס</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="לינק למצגת הקורס (URL)"
                        value={coursePresentationLink}
                        onChange={(e) => setCoursePresentationLink(e.target.value)}
                        placeholder="https://..."
                        type="url"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCoursePresentationDialogOpen(false)}>ביטול</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!courseId) return;
                            try {
                                await updateVideoCourse(courseId, {
                                    coursePresentationLink: coursePresentationLink.trim() || undefined,
                                });
                                if (course) {
                                    setCourse({
                                        ...course,
                                        coursePresentationLink: coursePresentationLink.trim() || undefined,
                                    } as any);
                                }
                                setCoursePresentationDialogOpen(false);
                            } catch (err: any) {
                                alert(err.message || 'שגיאה בשמירת מצגת הקורס');
                            }
                        }}
                    >
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}


