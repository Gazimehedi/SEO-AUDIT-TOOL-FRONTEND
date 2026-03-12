export default function AuditScore({ score, label }: { score: number, label: string }) {
    let color = 'text-red-500';
    let strokeColor = 'stroke-red-500';
    if (score >= 90) { color = 'text-emerald-500'; strokeColor = 'stroke-emerald-500'; }
    else if (score >= 50) { color = 'text-yellow-500'; strokeColor = 'stroke-yellow-500'; }

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        className="text-slate-800"
                    />
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={`${strokeColor} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                    />
                </svg>
                <span className={`text-2xl font-black ${color}`}>{score}</span>
            </div>
            <span className="text-slate-400 text-sm mt-3 font-medium uppercase tracking-wider">{label}</span>
        </div>
    );
}
