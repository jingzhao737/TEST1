;let isLight = false;
(function initTheme() {
  if (localStorage.getItem("theme") === "light") {
    document.documentElement.classList.add("light");
    isLight = true;
  }
})();

let workData = {
  flux: {
    name: 'JingZhao737', tag: 'Abstract \u00b7 Color Field',
    subtitle: 'Oil on canvas. An exploration of chromatic tension and release.',
    meta: { Medium: 'Oil on Canvas', Dimensions: '1280 \u00d7 720 px', Year: '2026' },
    content: [
      { h2: 'About This Work', p: 'Chromatic Flux is the culmination of a year-long investigation into how adjacent hues interact at their boundaries. The painting uses over forty individually mixed oil pigments, applied in thin, translucent layers that build depth through optical blending rather than physical mixing.' },
      { h2: 'Process', p: 'Each layer required three to five days of drying time. The painting evolved slowly, with earlier layers influencing\u2014but not dictating\u2014later decisions. This deliberate pace allowed the color relationships to develop organically, almost geologically.' },
      { h2: 'Context', p: 'This piece is part of the ongoing Chromatic Series, which examines color not as a property of objects but as a phenomenon in itself\u2014something to be experienced directly, without the mediation of representation.' }
    ],
    gallery: ['images/detail/hero1.webp']
  },
  silence: {
    name: 'Star', tag: 'Digital \u00b7 Minimal',
    subtitle: 'A digital meditation on negative space and quiet intensity.',
    meta: { Medium: 'Digital Painting', Dimensions: '3440 \u00d7 2880 px', Year: '2025' },
    content: [
      { h2: 'About This Work', p: 'The Shape of Silence began as an experiment in restraint. How much can you remove from an image before it loses its voice? The answer, I discovered, is almost everything\u2014as long as what remains is placed with absolute conviction.' },
      { h2: 'Process', p: 'Created entirely in a digital environment, this piece went through over sixty iterations. Each version stripped away another element until only the essential forms remained. The final composition uses just three distinct values.' },
      { h2: 'Context', p: 'This work was featured in the 2025 Digital Arts Biennale and later acquired by a private collector in Berlin. It represents a turning point in my digital practice toward greater economy of means.' }
    ],
    gallery: ['images/detail/hero2.webp']
  },
  neon: {
    name: 'Blade Runner', tag: 'Installation \u00b7 Light Art',
    subtitle: 'Acrylic, LED, and the ritual of artificial light.',
    meta: { Medium: 'Acrylic & LED Installation', Dimensions: '2580 \u00d7 1080 px', Year: '2024' },
    content: [
      { h2: 'About This Work', p: 'Neon Liturgy transforms a gallery wall into a luminous altar. Seven individually programmed LED strips respond to ambient sound, creating a constantly shifting composition that never repeats.' },
      { h2: 'Process', p: 'The acrylic panels were cast by hand, each with a unique surface texture that scatters light differently. The LEDs are controlled by a custom microcontroller running a generative algorithm that samples room tone and conversation fragments.' },
      { h2: 'Context', p: 'Originally commissioned for a group show exploring the intersection of technology and ritual, Neon Liturgy has since been adapted for three different venues, each time responding to the unique acoustic profile of its new environment.' }
    ],
    gallery: ['images/detail/hero3.webp']
  },
  tidal: {
    name: 'Breath', tag: 'Projection \u00b7 Site-Specific',
    subtitle: 'An ephemeral intervention mapping memory onto urban surfaces.',
    meta: { Medium: 'Projection Mapping', Dimensions: '2580 \u00d7 1080 px', Year: '2023' },
    content: [
      { h2: 'About This Work', p: 'Tidal Memory is a site-specific projection piece that maps historical imagery onto the facade of a decommissioned riverside warehouse. The projected images rise and fall in intensity, synchronized with real-time tidal data from the adjacent river.' },
      { h2: 'Process', p: 'The projection mapping was developed using lidar scans of the building surface, allowing the imagery to conform precisely to every brick and window frame. The real-time data connection to tidal sensors means no two viewings are ever identical.' },
      { h2: 'Context', p: 'Commissioned for the 2023 Riverside Art Festival, Tidal Memory ran for three nights and was experienced by over 15,000 visitors. Documentation of the piece was later exhibited as a multi-channel video installation.' }
    ],
    gallery: ['images/detail/hero4.webp']
  }
};


let workHeroMap = {
  flux: 'images/works/hero1.webp',
  silence: 'images/works/hero2.webp',
  neon: 'images/works/hero3.webp',
  tidal: 'images/works/hero4.webp'
};


