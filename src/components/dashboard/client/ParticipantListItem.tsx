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
  const { name, preferredName, photo, location, services } = participant;

  const displayName = preferredName || name;
  const initials = displayName
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
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-sm font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 font-poppins truncate">
            {displayName}
          </h3>
          {location && (
            <p className="text-sm text-gray-500 font-poppins truncate mt-0.5">
              {location}
            </p>
          )}

          {/* Tags row */}
          {services && services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                {services.length} service{services.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
