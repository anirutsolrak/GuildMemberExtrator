import React, { useState } from 'react';
import MemberList from './components/MemberList';
import MemberCard from './components/MemberCard';
import FilterBar from './components/FilterBar';
import PrizeWheel from './components/PrizeWheel';
import WinnerModal from './components/WinnerModal';
import { reportError } from './utils/api';
import { extractDataFromVideo } from './utils/api';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import GiftIcon from '@mui/icons-material/CardGiftcard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const theme = createTheme({
    palette: {
        primary: {
            main: '#4F5AFF',
            dark: '#6C72FF',
            contrastText: '#fff'
        },
        background: {
            paper: '#1A1F3D',
        },
        text: {
            primary: '#fff',
            secondary: '#8890B5',
        },
        error: {
            main: '#d32f2f',
        }
    },
});

const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: '8px',
    padding: '12px 24px',
    margin: '15px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
}));

const StyledInput = styled('input')({
    display: 'none',
});

function App() {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [winners, setWinners] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('score');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [videoFile, setVideoFile] = useState(null);

    const [filters, setFilters] = useState({
        minScore: '',
        maxScore: '',
        rankFilter: ''
    });

    const handleVideoChange = (event) => {
        const file = event.target.files[0];
        setVideoFile(file);
        setMembers([]);
        setFilteredMembers([]);
        setError('');
    };

    const extractData = async () => {
        try {
            setLoading(true);
            setError('');

            if (!videoFile) {
                throw new Error('Please select a video file');
            }

            const extractedData = await extractDataFromVideo(videoFile);
            console.log("Dados extraídos da IA:", extractedData); // Adicione este console.log!!!
            setMembers(extractedData);
            setFilteredMembers(extractedData);

        } catch (error) {
            reportError(error);
            setError(error.message || 'Failed to extract data from video');
            setMembers([]);
            setFilteredMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);
        filterMembers(term, sortOrder);
    };

    const handleSort = (event) => {
        const order = event.target.value;
        setSortOrder(order);
        filterMembers(searchTerm, order);
    };

    const filterMembers = (term, order, newFilters = filters) => {
        try {
            if (!Array.isArray(members)) {
                throw new Error('Invalid members data');
            }
            let filtered = [...members];

            if (newFilters) {
                // Converte os valores dos filtros para números antes de usar
                const minScore = newFilters.minScore ? parseInt(newFilters.minScore, 10) : null;
                const maxScore = newFilters.maxScore ? parseInt(newFilters.maxScore, 10) : null;
                const rankFilter = newFilters.rankFilter ? String(newFilters.rankFilter) : null;

                if (minScore !== null) {
                    filtered = filtered.filter(member => member.Score >= minScore); // Alterado "score" para "Score"
                }
                if (maxScore !== null) {
                    filtered = filtered.filter(member => member.Score <= maxScore); // Alterado "score" para "Score"
                }
                if (rankFilter !== null) {
                    filtered = filtered.filter(member => String(member.rank) === rankFilter);
                }
            }

            filtered = filtered.filter(member =>
                member["Names/Nicks"] && member["Names/Nicks"].toLowerCase().startsWith(term.toLowerCase())
            );

            if (order === 'score') {
                filtered.sort((a, b) => b.Score - a.Score); // Alterado "score" para "Score"
            } else if (order === 'rank') {
                filtered.sort((a, b) => a.rank - b.rank);
            }

            setFilteredMembers(filtered);
        } catch (error) {
            reportError(error);
            setError('Error filtering members');
            setFilteredMembers([]);
        }
    };



    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        filterMembers(searchTerm, sortOrder, newFilters);
    };

    const getVideoName = () => {
        return videoFile ? videoFile.name : 'No video selected';
    };

    return (
        <ThemeProvider theme={theme}>
            <Box data-name="app-container" sx={{ minHeight: '100vh', p: 6 }}>
                <Box className="card" sx={{ maxWidth: '6xl', mx: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                            Arcane Guild Members
                        </Typography>
                        <StyledButton
                            onClick={() => setIsSidebarOpen(true)}
                            variant="contained"
                            startIcon={<GiftIcon />}
                        >
                            Prize Wheel
                        </StyledButton>
                    </Box>

                    {/* Video Upload Section */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 6 }}>
                        <label htmlFor="upload-video">
                            <StyledInput
                                accept="video/*"
                                id="upload-video"
                                type="file"
                                onChange={handleVideoChange}
                                disabled={loading}
                            />
                            <StyledButton
                                component="span"
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                disabled={loading}
                            >
                                Upload Video
                            </StyledButton>
                        </label>

                        <Typography variant="body2" color="textSecondary">
                            {getVideoName()}
                        </Typography>

                        <StyledButton
                            onClick={extractData}
                            disabled={!videoFile || loading}
                            variant="contained"
                            sx={{ opacity: !videoFile || loading ? 0.5 : 1, cursor: !videoFile || loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Extract Data'}
                        </StyledButton>
                    </Box>

                    {/* Display Error */}
                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <FilterBar onFilter={handleFilterChange} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="search-input"
                            onChange={handleSearch}
                            value={searchTerm}
                        />
                    </Box>

                    {filteredMembers.length > 0 ? (
                        <MemberList
                            members={filteredMembers}
                            onMemberSelect={() => { }}
                        />
                    ) : (
                        filteredMembers.length === 0 && searchTerm ? (
                            <Typography sx={{ color: '#8890B5', textAlign: 'center' }}>
                                No results found for "{searchTerm}"
                            </Typography>
                        ) : null
                    )}
                </Box>
                {isSidebarOpen && (
                    <Box className="fixed inset-0 bg-black/50" sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Box className="fixed inset-y-0 right-0 w-96 bg-[#1A1F3D] p-6 shadow-xl" sx={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: 300, backgroundColor: '#1A1F3D' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                                <Typography variant='h6' sx={{ fontWeight: 'bold', margin: '15px' }}>Prize Wheel</Typography>
                                <StyledButton
                                    onClick={() => setIsSidebarOpen(false)}
                                    sx={{ color: '#8890B5', '&:hover': { color: 'white' } }}
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </StyledButton>
                            </Box>
                            <PrizeWheel
                                members={filteredMembers}
                                onWinnerSelect={setWinners}
                            />
                        </Box>
                    </Box>
                )}
                <WinnerModal
                    winners={winners}
                    onClose={() => setWinners([])}
                />
            </Box>
        </ThemeProvider>
    );
}

export default App;