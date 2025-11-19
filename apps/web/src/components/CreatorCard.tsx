interface CreatorCardProps {
  id: string;
  displayName: string;
  pricePerMinute: number;
  heroImageUrl?: string | null;
  bio?: string | null;
  onStart: (creatorId: string) => void;
  onSubscribe: (creatorId: string) => void;
}

export const CreatorCard = ({ id, displayName, pricePerMinute, heroImageUrl, bio, onStart, onSubscribe }: CreatorCardProps) => {
  return (
    <div className="card">
      {heroImageUrl && <img src={heroImageUrl} alt={displayName} className="card__image" />}
      <div>
        <h3>{displayName}</h3>
        <p>${(pricePerMinute / 100).toFixed(2)} / min</p>
        {bio && <p className="card__bio">{bio}</p>}
      </div>
      <div className="card__actions">
        <button className="secondary" onClick={() => onSubscribe(id)}>
          Subscribe
        </button>
        <button onClick={() => onStart(id)}>Start Call</button>
      </div>
    </div>
  );
};
