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
    Tab,
    Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, Link as LinkIcon, Search } from '@mui/icons-material';
import { 
    getSharedFiles, 
    createSharedFile, 
    updateSharedFile, 
    deleteSharedFile,
    type SharedFile 
} from '../firebase/sharedFilesApi';
import { auth } from '../firebase/firebase';
import { getUsers, getUserByUid, type User } from '../firebase/usersApi';

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
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<SharedFile | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isStudent, setIsStudent] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'presentation' as 'presentation' | 'worksheet' | 'solutions',
        url: '',
        description: ''
    });

    useEffect(() => {
        loadFiles();
        loadUsers();
        loadCurrentUserRole();
    }, []);

    useEffect(() => {
        filterFiles();
    }, [files, tabValue, searchQuery]);

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

    const loadUsers = async () => {
        try {
            const usersList = await getUsers();
            setUsers(usersList);
        } catch (err: any) {
            console.error('Error loading users:', err);
        }
    };

    const loadCurrentUserRole = async () => {
        try {
            if (!auth.currentUser?.uid) {
                setIsStudent(false);
                return;
            }
            const current = await getUserByUid(auth.currentUser.uid);
            setIsStudent(current?.role === 'student');
        } catch (err) {
            console.error('Error loading current user role:', err);
            setIsStudent(false);
        }
    };

    const filterFiles = () => {
        const types = ['presentation', 'worksheet', 'solutions'];
        const type = types[tabValue];
        let filtered = files.filter(f => f.type === type);
        
        // חיפוש לפי שם ותיאור
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(file => {
                const nameMatch = file.name.toLowerCase().includes(query);
                const descriptionMatch = file.description?.toLowerCase().includes(query) || false;
                return nameMatch || descriptionMatch;
            });
        }
        
        setFilteredFiles(filtered);
    };

    // יצירת רשימת אפשרויות ל-autocomplete (שם ותיאור)
    const getAutocompleteOptions = (): string[] => {
        const types = ['presentation', 'worksheet', 'solutions'];
        const type = types[tabValue];
        const typeFilteredFiles = files.filter(f => f.type === type);
        
        const options = new Set<string>();
        typeFilteredFiles.forEach(file => {
            if (file.name) options.add(file.name);
            if (file.description) options.add(file.description);
        });
        
        return Array.from(options);
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (file?: SharedFile) => {
        if (isStudent) {
            return;
        }
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

        if (isStudent) {
            setError('לסטודנטים אין הרשאה להוסיף או לערוך קבצים');
            return;
        }

        try {
            // מצא את המשתמש הנוכחי כדי לקבל את השם
            const currentUser = users.find(u => u.uid === auth.currentUser?.uid);
            const currentUserName = currentUser?.name || auth.currentUser.displayName || 'משתמש לא ידוע';

            if (editingFile) {
                await updateSharedFile(editingFile.id!, {
                    name: formData.name,
                    type: formData.type,
                    url: formData.url,
                    description: formData.description.trim() || undefined,
                    createdBy: editingFile.createdBy,
                    createdByName: editingFile.createdByName || currentUserName
                });
            } else {
                await createSharedFile({
                    name: formData.name,
                    type: formData.type,
                    url: formData.url,
                    description: formData.description.trim() || undefined,
                    createdBy: auth.currentUser.uid,
                    createdByName: currentUserName
                });
            }
            handleCloseDialog();
            loadFiles();
        } catch (err: any) {
            setError(err.message || 'שגיאה בשמירת קובץ');
        }
    };

    const handleDelete = async (fileId: string) => {
        if (isStudent) {
            setError('לסטודנטים אין הרשאה למחוק קבצים');
            return;
        }

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
                {!isStudent && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        הוסף קובץ
                    </Button>
                )}
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
                        <Box sx={{ p: 2, pb: 0 }}>
                            <Autocomplete
                                freeSolo
                                options={getAutocompleteOptions()}
                                inputValue={searchQuery}
                                onInputChange={(_event, newValue) => {
                                    setSearchQuery(newValue || '');
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="חפש לפי שם או תיאור"
                                        placeholder="הקלד לחיפוש..."
                                        inputProps={{
                                            ...params.inputProps,
                                            dir: 'rtl',
                                            style: { textAlign: 'right' }
                                        }}
                                        InputLabelProps={{
                                            ...params.InputLabelProps,
                                            style: { direction: 'rtl' }
                                        }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <Search sx={{ ml: 1, color: 'text.secondary', mr: 1 }} />
                                                    {params.InputProps.startAdornment}
                                                </>
                                            )
                                        }}
                                    />
                                )}
                                sx={{ mb: 2, direction: 'rtl' }}
                            />
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>שם</TableCell>
                                        <TableCell>תיאור</TableCell>
                                        <TableCell>נטען על ידי</TableCell>
                                        <TableCell>לינק</TableCell>
                                        {!isStudent && <TableCell>פעולות</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredFiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isStudent ? 4 : 5} align="center" sx={{ py: 4 }}>
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
                                                <TableCell>{file.createdByName || '-'}</TableCell>
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
                                                {!isStudent && (
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
                                                )}
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

