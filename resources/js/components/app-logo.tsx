export default function AppLogo() {
    return (
        <>
            <img
                src="/JobTrackr-logo.png"
                alt=""
                className="size-9 shrink-0 object-contain"
            />
            <div className="ml-2 grid flex-1 text-left text-lg">
                <span className="truncate leading-tight font-semibold">
                    JobTrackr
                </span>
            </div>
        </>
    );
}
