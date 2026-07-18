import React from "react";
import {Composition} from "remotion";
import {ProofOfStyle} from "./compositions/ProofOfStyle";
import {LaunchFilm} from "./compositions/LaunchFilm";

export const TrailerRoot: React.FC = () => <>
  <Composition id="LaunchFilm" component={LaunchFilm} durationInFrames={3600} fps={60} width={1080} height={1920}/>
  <Composition id="ProofOfStyle" component={ProofOfStyle} durationInFrames={900} fps={60} width={1080} height={1920}/>
</>;
