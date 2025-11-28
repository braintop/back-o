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
    CardMedia,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { getVideoCourses, type VideoCourse } from '../../firebase/videoCoursesApi';
import { auth } from '../../firebase/firebase';
import { getUserByUid } from '../../firebase/usersApi';

export default function VideoCourses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<VideoCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdminAndLoad = async () => {
            if (!auth.currentUser) {
                setIsAdmin(false);
                navigate('/video-courses/view');
                return;
            }
            try {
                const current = await getUserByUid(auth.currentUser.uid);
                if (current?.role === 'admin') {
                    setIsAdmin(true);
                    await loadCourses();
                } else {
                    setIsAdmin(false);
                    navigate('/video-courses/view');
                }
            } catch (err) {
                console.error('Error determining admin role for video courses:', err);
                setIsAdmin(false);
                navigate('/video-courses/view');
            }
        };

        checkAdminAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getVideoCourses(false);
            setCourses(data);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת קורסי וידאו');
        } finally {
            setLoading(false);
        }
    };

    if (isAdmin === null || loading) {
        return (
            <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" dir="rtl" sx={{ mt: 4, mb: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    flexDirection: 'row-reverse'
                }}
            >
                <Typography variant="h4" component="h1">
                    קורסי וידאו
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/video-courses/new')}
                >
                    קורס וידאו חדש
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        אין קורסי וידאו עדיין
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/video-courses/new')}
                    >
                        צור קורס וידאו ראשון
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ direction: 'rtl' }}>
                    {courses.map((course) => (
                        // @ts-expect-error - MUI v7 Grid types issue
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/video-courses/${course.id}`)}
                            >
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
                                    {course.editorName && (
                                        <Typography variant="body2" color="text.secondary">
                                            עורך הקורס: {course.editorName}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}


