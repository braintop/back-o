import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button
} from '@mui/material';
import { getCourses, type Course } from '../firebase/coursesApi';

export default function FrontLessonsView() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
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

        load();
    }, []);

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
                    mb: 3,
                    flexDirection: 'row-reverse'
                }}
            >
                <Typography variant="h4" component="h1">
                    צפייה בשיעורים פרונטליים
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {courses.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    אין קורסים פרונטליים זמינים כרגע.
                </Typography>
            ) : (
                <Grid container spacing={3} sx={{ direction: 'rtl' }}>
                    {courses.map((course) => (
                        // @ts-expect-error - MUI v7 Grid types issue
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Card
                                sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                                onClick={() => navigate(`/front-lessons/${course.id}`)}
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
                                </CardContent>
                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/front-lessons/${course.id}`);
                                        }}
                                    >
                                        צפה בשיעורי הקורס
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