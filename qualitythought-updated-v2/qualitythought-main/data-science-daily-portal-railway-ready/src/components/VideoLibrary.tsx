import React, { useEffect, useState } from "react";
import { Youtube, FileVideo, Plus, Trash2, Video } from "lucide-react";
import { SYLLABUS, getTopicTitleForDay } from "../types.js";

interface VideoEntry {
  id: string;
  title: string;
  youtubeUrl?: string;
  driveUrl?: string;
}

const STORAGE_KEY = "qt_topic_videos_v1";

function loadVideos(): Record<number, VideoEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVideos(data: Record<number, VideoEntry[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function extractYoutubeEmbed(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function extractDriveEmbed(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return null;
}

interface VideoLibraryProps {
  totalDays?: number;
}

export default function VideoLibrary({ totalDays = 60 }: VideoLibraryProps) {
  const [videos, setVideos] = useState<Record<number, VideoEntry[]>>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [newTitle, setNewTitle] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newDrive, setNewDrive] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setVideos(loadVideos());
  }, []);

  const dayVideos = videos[selectedDay] || [];
  const topicTitle = getTopicTitleForDay ? getTopicTitleForDay(selectedDay) : `Day ${selectedDay}`;

  const addVideo = () => {
    if (!newTitle.trim() || (!newYoutube.trim() && !newDrive.trim())) return;
    const entry: VideoEntry = {
      id: `${Date.now()}`,
      title: newTitle.trim(),
      youtubeUrl: newYoutube.trim() || undefined,
      driveUrl: newDrive.trim() || undefined
    };
    const updated = { ...videos, [selectedDay]: [...(videos[selectedDay] || []), entry] };
    setVideos(updated);
    saveVideos(updated);
    setNewTitle("");
    setNewYoutube("");
    setNewDrive("");
    setShowAdd(false);
  };

  const removeVideo = (id: string) => {
    const updated = { ...videos, [selectedDay]: dayVideos.filter((v) => v.id !== id) };
    setVideos(updated);
    saveVideos(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-rose-600" />
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Topic Video Library
            </h4>
            <p className="text-[10px] text-slate-400">YouTube &amp; Google Drive lecture recordings by day</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Video
        </button>
      </div>

      <div className="p-4 border-b border-slate-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Select Day / Topic
        </span>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(Number(e.target.value))}
          className="w-full sm:w-auto text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-rose-400"
        >
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              Day {d} — {getTopicTitleForDay ? getTopicTitleForDay(d) : `Topic ${d}`}
            </option>
          ))}
        </select>
      </div>

      {showAdd && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Video title (e.g. Loops Explained)"
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-rose-400"
          />
          <input
            type="text"
            value={newYoutube}
            onChange={(e) => setNewYoutube(e.target.value)}
            placeholder="YouTube link (https://youtube.com/watch?v=...)"
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-rose-400"
          />
          <input
            type="text"
            value={newDrive}
            onChange={(e) => setNewDrive(e.target.value)}
            placeholder="Google Drive share link (optional)"
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={addVideo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
          >
            Save Video
          </button>
        </div>
      )}

      <div className="p-5 space-y-6">
        <h5 className="font-bold text-slate-800 text-sm">{topicTitle}</h5>

        {dayVideos.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            No videos added for this day yet. Click &quot;Add Video&quot; to attach a YouTube or Drive
            recording.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {dayVideos.map((v) => {
              const ytEmbed = v.youtubeUrl ? extractYoutubeEmbed(v.youtubeUrl) : null;
              const driveEmbed = v.driveUrl ? extractDriveEmbed(v.driveUrl) : null;
              return (
                <div key={v.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {v.youtubeUrl ? (
                        <Youtube className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <FileVideo className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      {v.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVideo(v.id)}
                      className="text-slate-300 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="aspect-video bg-black">
                    {ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        className="w-full h-full"
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : driveEmbed ? (
                      <iframe
                        src={driveEmbed}
                        className="w-full h-full"
                        title={v.title}
                        allow="autoplay"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-[10px]">
                        Invalid video link
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
