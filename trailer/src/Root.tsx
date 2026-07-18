import React from "react";
import {Composition} from "remotion";
import {ProofOfStyle} from "./compositions/ProofOfStyle";

export const TrailerRoot: React.FC = () => (
  <Composition
    id="ProofOfStyle"
    component={ProofOfStyle}
    durationInFrames={900}
    fps={60}
    width={1080}
    height={1920}
  />
);
