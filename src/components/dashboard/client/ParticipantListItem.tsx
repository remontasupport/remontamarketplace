"use client";

interface ParticipantListItemProps {
  participant: {
    id: string;
    name: string;
    preferredName?: string;
    photo?: string | null;
    location?: string;
    services?: string[];
  };
  isSelected: boolean;
  onClick: () => void;
}

export default function ParticipantListItem({
  participant,
  isSelected,
  onClick,
}: ParticipantListItemProps) {
  const { name, photo } = participant;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-sm font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 font-poppins truncate">
            {name}
          </h3>
        </div>
      </div>
    </button>
  );
}
