import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, Extension, Node } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Box, Button, ButtonGroup, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, CircularProgress } from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatStrikethrough,
    FormatListBulleted,
    FormatListNumbered,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    Link as LinkIcon,
    FormatColorText,
    FormatColorFill,
    Undo,
    Redo
} from '@mui/icons-material';
import CodeIcon from '@mui/icons-material/Code';
import FormatTextdirectionLToR from '@mui/icons-material/FormatTextdirectionLToR';
import FormatTextdirectionRToL from '@mui/icons-material/FormatTextdirectionRToL';
import VideoLibrary from '@mui/icons-material/VideoLibrary';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

interface ReadOnlyRichTextProps {
    value: string;
    placeholder?: string;
}

// Extension מותאם אישית ל-dir attribute על פסקאות
const TextDirection = Extension.create({
    // שם ייחודי כדי שלא יתנגש עם הרחבות אחרות
    name: 'customTextDirection',
    
    addGlobalAttributes() {
        return [
            {
                // נאפשר כיוון טקסט גם ל-codeBlock כדי שטקסט קוד יוכל להיות LTR
                types: ['paragraph', 'heading', 'codeBlock'],
                attributes: {
                    dir: {
                        default: null,
                        parseHTML: element => element.getAttribute('dir'),
                        renderHTML: attributes => {
                            if (!attributes.dir) {
                                return {};
                            }
                            return {
                                dir: attributes.dir,
                            };
                        },
                    },
                },
            },
        ];
    },
    
    addCommands() {
        return {
            setTextDirection: (direction: 'ltr' | 'rtl' | 'auto') => ({ state, tr, dispatch }) => {
                const { selection } = state;
                const { $from } = selection;
                const node = $from.parent;
                
                if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
                    const pos = $from.before($from.depth);
                    if (dispatch) {
                        tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            dir: direction,
                        });
                        dispatch(tr);
                    }
                    return true;
                }
                return false;
            },
            unsetTextDirection: () => ({ state, tr, dispatch }) => {
                const { selection } = state;
                const { $from } = selection;
                const node = $from.parent;
                
                if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
                    const pos = $from.before($from.depth);
                    if (dispatch) {
                        const { dir, ...attrs } = node.attrs;
                        tr.setNodeMarkup(pos, undefined, attrs);
                        dispatch(tr);
                    }
                    return true;
                }
                return false;
            },
        };
    },
});

// פונקציה שיוצרת את רשימת ההרחבות המשותפת גם לעורך וגם לתצוגה בלבד
const buildExtensions = (lowlightInstance: any) => [
    StarterKit.configure({
        codeBlock: false,
        // נבטל את Link ו-Underline המובנים כדי שנשתמש בגרסאות המורחבות שלנו
        link: false,
        underline: false,
        heading: {
            levels: [1, 2, 3],
        },
    }),
    CodeBlockLowlight.configure({
        lowlight: lowlightInstance,
    }),
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
    Color,
    TextStyle,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'link',
        },
    }),
    Underline,
    Highlight.configure({
        multicolor: true,
    }),
    TextDirection,
    VideoEmbed,
];

// פונקציה להמרת URL ל-embed URL (YouTube או Vimeo)
const getEmbedUrl = (input: string, type: 'youtube' | 'vimeo'): string | null => {
    let url = input.trim();
    
    // אם זה iframe code, נחלץ את ה-URL מתוכו
    if (url.includes('<iframe') || url.includes('iframe')) {
        // חילוץ src מה-iframe - מחפש src= עם גרשיים
        const srcMatch = url.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            url = srcMatch[1].trim();
        } else {
            // אם לא מצאנו src, נחפש ישירות את ה-URL בתוך הטקסט
            if (type === 'youtube') {
                const youtubeMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
                if (youtubeMatch && youtubeMatch[1]) {
                    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                }
            } else if (type === 'vimeo') {
                const vimeoMatch = url.match(/vimeo\.com\/video\/([0-9]+)/);
                if (vimeoMatch && vimeoMatch[1]) {
                    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                }
            }
            return null;
        }
    }
    
    // YouTube
    if (type === 'youtube') {
        // אם זה כבר embed URL של YouTube, נחזיר אותו (נסיר query parameters)
        if (url.includes('youtube.com/embed/')) {
            const videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
        
        // YouTube - חילוץ video ID
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1]?.split('&')[0]?.split('#')[0] || '';
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
            }
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
    }
    
    // Vimeo
    if (type === 'vimeo') {
        // אם זה כבר embed URL של Vimeo, נחזיר אותו
        if (url.includes('player.vimeo.com/video/')) {
            const videoId = url.split('video/')[1]?.split('?')[0]?.split('&')[0] || '';
            if (videoId) {
                return `https://player.vimeo.com/video/${videoId}`;
            }
        }
        
        // Vimeo - חילוץ video ID מכל סוגי ה-URLs
        if (url.includes('vimeo.com')) {
            let videoId = '';
            
            // vimeo.com/manage/videos/347
            if (url.includes('vimeo.com/manage/videos/')) {
                videoId = url.split('vimeo.com/manage/videos/')[1]?.split('?')[0]?.split('/')[0] || '';
            }
            // vimeo.com/video/347
            else if (url.includes('vimeo.com/video/')) {
                videoId = url.split('vimeo.com/video/')[1]?.split('?')[0]?.split('/')[0] || '';
            }
            // player.vimeo.com/video/347
            else if (url.includes('player.vimeo.com/video/')) {
                videoId = url.split('video/')[1]?.split('?')[0]?.split('&')[0] || '';
            }
            // vimeo.com/347 (URL קצר)
            else if (url.includes('vimeo.com/')) {
                const parts = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/') || [];
                // נחפש מספר - זה ה-video ID
                videoId = parts.find(part => /^\d+$/.test(part)) || '';
            }
            
            if (videoId && /^\d+$/.test(videoId)) {
                return `https://player.vimeo.com/video/${videoId}`;
            }
        }
    }
    
    return null;
};

// Node מותאם אישית להטמעת וידאו
const VideoEmbed = Node.create({
    name: 'videoEmbed',
    
    group: 'block',
    
    atom: true,
    
    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: element => {
                    const iframe = element.querySelector('iframe');
                    return iframe ? iframe.getAttribute('src') : null;
                },
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'div[class="video-embed"]',
                getAttrs: (element) => {
                    if (typeof element === 'string') return false;
                    const iframe = element.querySelector('iframe');
                    return iframe ? { src: iframe.getAttribute('src') } : false;
                },
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        const src = HTMLAttributes.src;
        if (!src) return ['div'];
        
        return [
            'div',
            {
                class: 'video-embed',
                style: 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;',
            },
            [
                'iframe',
                {
                    src: src,
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                    allowfullscreen: 'true',
                    style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
                },
            ],
        ];
    },
    
    // @ts-expect-error - Custom command not in RawCommands type
    addCommands() {
        return {
            setVideo: (url: string, type: 'youtube' | 'vimeo' = 'youtube') => ({ commands }: { commands: any }) => {
                // אם ה-URL כבר embed URL, נשתמש בו ישירות
                let embedUrl: string | null = null;
                if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
                    // זה כבר embed URL - נשתמש בו ישירות
                    embedUrl = url.split('?')[0]; // נסיר query parameters
                } else {
                    // נמיר את ה-URL ל-embed URL
                    embedUrl = getEmbedUrl(url, type);
                }
                
                if (!embedUrl) {
                    console.error('Failed to get embed URL for:', url, 'type:', type);
                    return false;
                }
                
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        src: embedUrl,
                    },
                });
            },
        };
    },
});

export default function RichTextEditor({ value, onChange, placeholder = 'הזן תיאור...' }: RichTextEditorProps) {
    const lowlightInstance = createLowlight(common);
    const textColorInputRef = useRef<HTMLInputElement>(null);
    const backgroundColorInputRef = useRef<HTMLInputElement>(null);
    const [textColor, setTextColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#FFFF00');
    const [, forceUpdate] = useState({});
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoType, setVideoType] = useState<'youtube' | 'vimeo'>('youtube');
    
    const editor = useEditor({
        extensions: buildExtensions(lowlightInstance),
        immediatelyRender: false,
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onSelectionUpdate: () => {
            // עדכון אוטומטי של הכפתורים כשהמיקום משתנה
            forceUpdate({});
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                dir: 'rtl',
                style: 'min-height: 150px; padding: 12px; text-align: right;',
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
            // עדכון צבעים מהתוכן הקיים
            const currentTextColor = editor.getAttributes('textStyle').color;
            if (currentTextColor) {
                setTextColor(currentTextColor);
            }
        }
    }, [value, editor]);


    if (!editor) {
        return (
            <Box sx={{ 
                minHeight: '150px', 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
            }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                    טוען עורך טקסט...
                </Typography>
            </Box>
        );
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('הזן URL:', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden', minHeight: '200px' }}>
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 1, 
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    direction: 'rtl'
                }}
            >
                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        color={editor.isActive('bold') ? 'primary' : 'default'}
                    >
                        <FormatBold fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        color={editor.isActive('italic') ? 'primary' : 'default'}
                    >
                        <FormatItalic fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        color={editor.isActive('underline') ? 'primary' : 'default'}
                    >
                        <FormatUnderlined fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        color={editor.isActive('strike') ? 'primary' : 'default'}
                    >
                        <FormatStrikethrough fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => {
                            // בלוק קוד מיוחד להדבקת קוד – תמיד שמאל ולמעלה (LTR)
                            editor.chain().focus().toggleCodeBlock().run();
                            const node = editor.state.selection.$from.parent;
                            if (node.type.name === 'codeBlock') {
                                editor.chain().focus().setTextDirection('ltr').run();
                            }
                        }}
                        color={editor.isActive('codeBlock') ? 'primary' : 'default'}
                        title="בלוק קוד (להדבקת קוד מ‑VS Code)"
                    >
                        <CodeIcon fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
                    >
                        <FormatAlignRight fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
                    >
                        <FormatAlignCenter fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
                    >
                        <FormatAlignLeft fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        color={editor.isActive('bulletList') ? 'primary' : 'default'}
                    >
                        <FormatListBulleted fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        color={editor.isActive('orderedList') ? 'primary' : 'default'}
                    >
                        <FormatListNumbered fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <input
                            ref={textColorInputRef}
                            type="color"
                            value={textColor}
                            onChange={(e) => {
                                const color = e.target.value;
                                setTextColor(color);
                                editor.chain().focus().setColor(color).run();
                            }}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                                pointerEvents: 'none',
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={() => {
                                const currentColor = editor.getAttributes('textStyle').color || '#000000';
                                setTextColor(currentColor);
                                textColorInputRef.current?.click();
                            }}
                            sx={{ 
                                color: editor.getAttributes('textStyle').color || 'inherit',
                            }}
                        >
                            <FormatColorText fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <input
                            ref={backgroundColorInputRef}
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => {
                                const color = e.target.value;
                                setBackgroundColor(color);
                                editor.chain().focus().toggleHighlight({ color }).run();
                            }}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: 0,
                                height: 0,
                                pointerEvents: 'none',
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={() => {
                                backgroundColorInputRef.current?.click();
                            }}
                            color={editor.isActive('highlight') ? 'primary' : 'default'}
                        >
                            <FormatColorFill fontSize="small" />
                        </IconButton>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={setLink}
                        color={editor.isActive('link') ? 'primary' : 'default'}
                    >
                        <LinkIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setVideoType('youtube');
                            setVideoDialogOpen(true);
                        }}
                        title="הטמע וידאו (YouTube)"
                        sx={{
                            backgroundColor: '#FF0000',
                            color: 'white',
                            marginRight: '4px',
                            '&:hover': {
                                backgroundColor: '#CC0000',
                            }
                        }}
                    >
                        <VideoLibrary fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setVideoType('vimeo');
                            setVideoDialogOpen(true);
                        }}
                        title="הטמע וידאו (Vimeo)"
                        sx={{
                            backgroundColor: '#1AB7EA',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#0EA5D6',
                            }
                        }}
                    >
                        <VideoLibrary fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <IconButton
                        size="small"
                        onClick={() => {
                            const node = editor.state.selection.$from.parent;
                            const currentDir = node.attrs.dir;
                            if (currentDir === 'ltr') {
                                editor.chain().focus().unsetTextDirection().run();
                            } else {
                                editor.chain().focus().setTextDirection('ltr').run();
                            }
                            forceUpdate({});
                        }}
                        color={
                            (() => {
                                const node = editor.state.selection.$from.parent;
                                return node.attrs.dir === 'ltr' ? 'primary' : 'default';
                            })()
                        }
                        title="Set text direction to left-to-right"
                    >
                        <FormatTextdirectionLToR fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => {
                            const node = editor.state.selection.$from.parent;
                            const currentDir = node.attrs.dir;
                            if (currentDir === 'rtl') {
                                editor.chain().focus().unsetTextDirection().run();
                            } else {
                                editor.chain().focus().setTextDirection('rtl').run();
                            }
                            forceUpdate({});
                        }}
                        color={
                            (() => {
                                const node = editor.state.selection.$from.parent;
                                return node.attrs.dir === 'rtl' ? 'primary' : 'default';
                            })()
                        }
                        title="Set text direction to right-to-left"
                    >
                        <FormatTextdirectionRToL fontSize="small" />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup size="small" variant="outlined">
                    <Button
                        size="small"
                        onClick={() => {
                            const level = window.prompt('בחר רמת כותרת (1-3):', '1');
                            if (level && ['1', '2', '3'].includes(level)) {
                                editor.chain().focus().toggleHeading({ level: parseInt(level) as 1 | 2 | 3 }).run();
                            }
                        }}
                    >
                        H{editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : ''}
                    </Button>
                </ButtonGroup>
            </Paper>
            <Box
                sx={{
                    '& .ProseMirror': {
                        outline: 'none',
                        minHeight: '150px',
                        padding: 2,
                        direction: 'rtl',
                        textAlign: 'right',
                        '& p[dir="ltr"], & h1[dir="ltr"], & h2[dir="ltr"], & h3[dir="ltr"], & pre[dir="ltr"]': {
                            direction: 'ltr',
                            textAlign: 'left',
                        },
                        '& p[dir="rtl"], & h1[dir="rtl"], & h2[dir="rtl"], & h3[dir="rtl"], & pre[dir="rtl"]': {
                            direction: 'rtl',
                            textAlign: 'right',
                        },
                        '& pre': {
                            direction: 'ltr',
                            textAlign: 'left',
                            fontFamily: '"Fira Code", "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace',
                            backgroundColor: '#f5f5f5',
                            borderRadius: 4,
                            padding: '8px 12px',
                            overflowX: 'auto',
                            fontSize: '0.9rem',
                        },
                    },
                }}
            >
                <EditorContent 
                    editor={editor} 
                    data-placeholder={placeholder}
                />
            </Box>
            
            <Dialog open={videoDialogOpen} onClose={() => {
                setVideoDialogOpen(false);
                setVideoUrl('');
            }} dir="rtl">
                <DialogTitle>הטמע וידאו ({videoType === 'youtube' ? 'YouTube' : 'Vimeo'})</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={`URL של וידאו ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'} או קוד Embed`}
                        fullWidth
                        variant="outlined"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder={videoType === 'youtube' 
                            ? "URL: https://www.youtube.com/watch?v=... או קוד iframe"
                            : "URL: https://vimeo.com/... או קוד iframe"}
                        helperText={videoType === 'youtube'
                            ? "ניתן להזין URL של YouTube או להדביק קוד iframe שלם"
                            : "ניתן להזין URL של Vimeo או להדביק קוד iframe שלם"}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setVideoDialogOpen(false);
                        setVideoUrl('');
                    }}>
                        ביטול
                    </Button>
                    <Button 
                        onClick={() => {
                            if (videoUrl && editor) {
                                const embedUrl = getEmbedUrl(videoUrl, videoType);
                                const isValid = videoType === 'youtube' 
                                    ? embedUrl && embedUrl.includes('youtube.com/embed/')
                                    : embedUrl && embedUrl.includes('player.vimeo.com/video/');
                                
                                if (isValid && embedUrl) {
                                    try {
                                        // נשתמש ב-command של ה-Node עם הסוג הנכון
                                        // נשלח את ה-embedUrl במקום את ה-URL המקורי
                                        (editor.chain().focus() as any).setVideo(embedUrl, videoType).run();
                                        // נסגור את ה-dialog תמיד אחרי הניסיון
                                        setVideoDialogOpen(false);
                                        setVideoUrl('');
                                    } catch (error) {
                                        console.error('Error adding video:', error);
                                        alert('שגיאה בהוספת הוידאו. אנא נסה שוב.');
                                    }
                                } else {
                                    console.log('Invalid URL:', videoUrl, 'Type:', videoType, 'Embed URL:', embedUrl);
                                    alert(`URL לא תקין. אנא הזן URL של ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'} או קוד iframe מלא`);
                                }
                            }
                        }}
                        variant="contained"
                        disabled={!videoUrl}
                    >
                        הוסף
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// רכיב לקריאה בלבד – מציג תוכן RichText עם אותו פורמט כמו בעורך, בלי אפשרות עריכה
export function ReadOnlyRichText({ value, placeholder = 'תיאור...' }: ReadOnlyRichTextProps) {
    const lowlightInstance = createLowlight(common);

    const editor = useEditor({
        extensions: buildExtensions(lowlightInstance),
        content: value,
        editable: false,
        editorProps: {
            attributes: {
                class: 'ProseMirror',
                dir: 'rtl',
                'data-placeholder': placeholder,
            },
        },
    });

    // לעדכן את התוכן כשמשתנה value (למשל כשבוחרים שיעור אחר לצפייה)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '');
        }
    }, [editor, value]);

    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ borderRadius: 1, overflow: 'hidden', minHeight: '150px' }}>
            <Box sx={{ '& .ProseMirror': { minHeight: '150px' } }}>
                <EditorContent editor={editor} />
            </Box>
        </Box>
    );
}
