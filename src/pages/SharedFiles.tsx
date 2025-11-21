import { useEffect, useState } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tabs,
    Tab
} from '@mui/material';
import { Add, Edit, Delete, Link as LinkIcon } from '@mui/icons-material';
import { 
    getSharedFiles, 
    createSharedFile, 
    updateSharedFile, 
    deleteSharedFile,
    type SharedFile 
} from '../firebase/sharedFilesApi';
import { auth } from '../firebase/firebase';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`file-tabpanel-${index}`}
            aria-labelledby={`file-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function SharedFiles() {
    const [tabValue, setTabValue] = useState(0);
    const [files, setFiles] = useState<SharedFile[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<SharedFile | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'presentation' as 'presentation' | 'worksheet' | 'solutions',
        url: '',
        description: ''
    });

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        filterFiles();
    }, [files, tabValue]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const filesData = await getSharedFiles();
            setFiles(filesData);
        } catch (err: any) {
            setError(err.message || 'שגיאה בטעינת קבצים');
        } finally {
            setLoading(false);
        }
    };

    const filterFiles = () => {
        const types = ['presentation', 'worksheet', 'solutions'];
        const type = types[tabValue];
        setFilteredFiles(files.filter(f => f.type === type));
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (file?: SharedFile) => {
        if (file) {
            setEditingFile(file);
            setFormData({
                name: file.name,
                type: file.type,
                url: file.url,
                description: file.description || ''
            });
        } else {
            setEditingFile(null);
            setFormData({
                name: '',
                type: types[tabValue] as 'presentation' | 'worksheet' | 'solutions',
                url: '',
                description: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingFile(null);
        setFormData({
            name: '',
            type: 'presentation',
            url: '',
            description: ''
        });
    };

    const handleSubmit = async () => {
        if (!auth.currentUser) {
            setError('אתה צריך להיות מחובר');
            return;
        }

        try {
            if (editingFile) {
                await updateSharedFile(editingFile.id!, {
                    name: formData.name,
                    type: formData.type,
                    url: formData.url,
                    description: formData.description.trim() || undefined,
                    createdBy: editingFile.createdBy
                });
            } else {
                await createSharedFile({
                    name: formData.name,
                    type: formData.type,
                    url: formData.url,
                    description: formData.description.trim() || undefined,
                    createdBy: auth.currentUser.uid
                });
            }
            handleCloseDialog();
            loadFiles();
        } catch (err: any) {
            setError(err.message || 'שגיאה בשמירת קובץ');
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את הקובץ?')) {
            return;
        }

        try {
            await deleteSharedFile(fileId);
            loadFiles();
        } catch (err: any) {
            setError(err.message || 'שגיאה במחיקת קובץ');
        }
    };

    const types = ['presentation', 'worksheet', 'solutions'];
    const typeLabels = ['מצגות', 'דפי עבודה', 'פתרונות'];

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    קבצי שיעור - מאגר משותף
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    הוסף קובץ
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        {typeLabels.map((label, index) => (
                            <Tab key={index} label={label} />
                        ))}
                    </Tabs>
                </Box>

                {types.map((_, index) => (
                    <TabPanel key={index} value={tabValue} index={index}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>שם</TableCell>
                                        <TableCell>תיאור</TableCell>
                                        <TableCell>לינק</TableCell>
                                        <TableCell>פעולות</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredFiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    אין קבצים עדיין
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredFiles.map((file) => (
                                            <TableRow key={file.id} hover>
                                                <TableCell>{file.name}</TableCell>
                                                <TableCell>{file.description || '-'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<LinkIcon />}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        פתח קובץ
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(file)}
                                                        color="primary"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(file.id!)}
                                                        color="error"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </TabPanel>
                ))}
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingFile ? 'עריכת קובץ' : 'הוספת קובץ חדש'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            fullWidth
                            label="שם הקובץ"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <FormControl fullWidth required>
                            <InputLabel>סוג קובץ</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                label="סוג קובץ"
                            >
                                <MenuItem value="presentation">מצגת</MenuItem>
                                <MenuItem value="worksheet">דף עבודה</MenuItem>
                                <MenuItem value="solutions">פתרונות</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="לינק (Google Drive או אחר)"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://drive.google.com/..."
                            required
                        />
                        <TextField
                            fullWidth
                            label="תיאור (אופציונלי)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ביטול</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        שמור
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

