interface CreatorCardProps {
  id: string;
  name: string;
  pricePerMin: number;
  live: boolean;
  onStart: (creatorId: string) => void;
}

export const CreatorCard = ({ id, name, pricePerMin, live, onStart }: CreatorCardProps) => {
  return (
    <div className="card">
      <div>
        <h3>{name}</h3>
        <p>${pricePerMin / 100}/min {live ? '• live' : ''}</p>
      </div>
      <button onClick={() => onStart(id)}>Start Session</button>
    </div>
  );
};
