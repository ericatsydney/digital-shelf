type PosterStageProps = {
  background: string;
  poster?: string;
  title?: string;
};

/** 2D stage: a shared background with the selected unit's transparent render layered in the same frame. */
export function PosterStage({ background, poster, title }: PosterStageProps) {
  return (
    <div className="poster-stage" data-testid="poster-stage">
      <div className="poster-stage__scene">
        <img className="poster-stage__layer" src={background} alt="" draggable={false} />
        <div className="poster-stage__matte" />
        {poster && <img className="poster-stage__layer poster-stage__layer--unit" src={poster} alt={title ?? 'Unit poster'} draggable={false} />}
      </div>
    </div>
  );
}
