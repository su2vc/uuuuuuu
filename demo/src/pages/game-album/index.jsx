import { useEffect } from 'react';
import AlbumExperience from './AlbumExperience.jsx';
import { warmAlbumImages } from './albumResources.js';
import { shouldCelebrateBirthday } from './birthdayRules.js';
import { useKeepsakeAudio } from '../../shared/audio/KeepsakeSound.jsx';
// Preserve the established album cascade.
import './opening.css';
import './birthday.css';
import './memories.css';
import './keepsakes.css';
import './styles.css';

export default function GameAlbumPage({ entry }) {
  const { stopEffects, setEntered } = useKeepsakeAudio();
  useEffect(() => {
    warmAlbumImages().catch(() => {});
  }, []);
  useEffect(() => () => {
    stopEffects();
    setEntered(false);
  }, [stopEffects, setEntered]);
  return <div className="game-album-page">
    <AlbumExperience birthday={shouldCelebrateBirthday(entry.enteredAt)} />
  </div>;
}
