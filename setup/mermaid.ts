import { defineMermaidSetup } from '@slidev/types';

const copilotCss = `
.copilot, .human, .woman {
  display: inline-block;
  width: 40px;
  height: 40px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  vertical-align: -0.15em;
}
  
.copilot {
  width: 36px;
  height: 36px;
  background-image: url('/github-copilot-96.png');
}

.human {
  background-image: url('/person-94.png');
}

.woman {
  background-image: url('/woman-94.png');
}
`;

export default defineMermaidSetup(() => ({
  themeCSS: copilotCss,
}));
