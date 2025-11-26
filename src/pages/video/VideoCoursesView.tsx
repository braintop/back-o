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
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { getVideoCourses, type VideoCourse } from '../../firebase/videoCoursesApi';

export default function VideoCoursesView() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<VideoCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            // רק קורסים שסומנו כגלויים
            const data = await getVideoCourses(true);
            setCourses(data);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת קורסי וידאו');
        } finally {
            setLoading(false);
        }
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
                    צפייה בקורסי וידאו
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        אין קורסי וידאו זמינים לצפייה כרגע
                    </Typography>
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
                                onClick={() => navigate(`/video-courses/view/${course.id}`)}
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
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<PlayCircleOutlineIcon />}
                                    >
                                        צפה בקורס
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}


