import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://orbit.ayande.xyz"}/releases/checksums.txt`,
    );
    const checksumsText = await response.text();

    const releases = checksumsText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, filename] = line.split(/\s+/);
        const platform = filename.replace("orbit-", "");
        const version = "1.0.0";

        return {
          version,
          platform,
          filename,
          hash,
          downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://orbit.ayande.xyz"}/releases/${filename}`,
          releasedAt: new Date().toISOString(),
        };
      });

    return NextResponse.json({
      latest: "1.0.0",
      releases,
      supportedPlatforms: [
        "linux-x64",
        "macos-x64",
        "macos-arm64",
        "windows-x64",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch releases" },
      { status: 500 },
    );
  }
}
