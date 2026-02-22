<script lang="ts">
  import './app.css';
  import PlayerUi from './components/player-ui.svelte';
  import { ViewProvider } from './components/timeline';
  import { PlayerProvider } from './state/video';
</script>

<PlayerProvider>
  <ViewProvider>
    <PlayerUi />
  </ViewProvider>
</PlayerProvider>
