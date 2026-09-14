export interface LofiTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: string;
}

// Free-to-use lo-fi / ambient tracks from Pixabay
export const LOFI_TRACKS: LofiTrack[] = [
  {
    id: 'lofi-study',
    title: 'Study Session',
    artist: 'FASSounds',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    duration: '2:32',
  },
  {
    id: 'lofi-chill',
    title: 'Chill Vibes',
    artist: 'FASSounds',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_600dc57913.mp3',
    duration: '1:58',
  },
  {
    id: 'lofi-dreamy',
    title: 'Dreamy Afternoon',
    artist: 'Coma-Media',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    duration: '2:14',
  },
  {
    id: 'lofi-midnight',
    title: 'Midnight Coffee',
    artist: 'Ashot-Danielyan',
    url: 'https://cdn.pixabay.com/audio/2024/11/05/audio_4956b4edd1.mp3',
    duration: '3:46',
  },
  {
    id: 'lofi-rain',
    title: 'Rainy Window',
    artist: 'SoundGalleryBy',
    url: 'https://cdn.pixabay.com/audio/2023/10/28/audio_dddce16b26.mp3',
    duration: '2:05',
  },
  {
    id: 'lofi-sunset',
    title: 'Golden Sunset',
    artist: 'Lesfm',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    duration: '2:00',
  },
];
