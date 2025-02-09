import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

const App = () => {
  const [query, setQuery] = useState(""); 
  const [videos, setVideos] = useState([]); 
  const [selectedVideo, setSelectedVideo] = useState(null); 
  const [comments, setComments] = useState([]); 
  const [loading, setLoading] = useState(false);

  const API_KEY = "AIzaSyAV_vVdjGOHm10QKDNJxS6d47Gl7Ku4gS8";

  const searchVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: query,
            type: "video",
            maxResults: 10,
            key: API_KEY,
          },
        }
      );
      setVideos(response.data.items);
    } catch (error) {
      console.error("Videolar alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (videoId) => {
    setLoading(true);
    let allComments = [];
    let nextPageToken = null;

    try {
      do {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/commentThreads",
          {
            params: {
              part: "snippet",
              videoId: videoId,
              key: API_KEY,
              pageToken: nextPageToken,
            },
          }
        );

        allComments = [...allComments, ...response.data.items];
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      setComments(allComments);
    } catch (error) {
      console.error("Yorumlar alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (comments.length === 0) {
      console.warn("İndirilecek yorum yok!");
      return;
    }

    const videoMetadata = {
      VideoBaşlık: selectedVideo.snippet.title,
      YayınlanmaTarihi: selectedVideo.snippet.publishedAt,
      KanalAdı: selectedVideo.snippet.channelTitle,
    };

    const commentData = comments.map((comment) => {
      const {
        authorDisplayName,
        publishedAt,
        textDisplay,
        likeCount,
      } = comment.snippet.topLevelComment.snippet;
      const { totalReplyCount } = comment.snippet;

      return {
        ...videoMetadata, 
        Yazar: authorDisplayName,
        Tarih: publishedAt,
        Yorum: textDisplay,
        Beğeni: likeCount,
        Yanıtlar: totalReplyCount,
      };
    });

    const csv = Papa.unparse(commentData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedVideo.snippet.title.replace(/[^a-zA-Z0-9]/g, "_")}_yorumlar.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      textAlign: "center",
    },
    input: {
      padding: "10px",
      width: "300px",
      marginRight: "10px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "5px",
      backgroundColor: "#007BFF",
      color: "#fff",
      border: "none",
      cursor: "pointer",
    },
    videoList: {
      listStyle: "none",
      padding: 0,
    },
    videoItem: {
      margin: "10px 0",
    },
    comments: {
      textAlign: "left",
      margin: "20px auto",
      maxWidth: "600px",
    },
    comment: {
      padding: "10px",
      borderBottom: "1px solid #ccc",
    },
    downloadButton: {
      padding: "10px 20px",
      borderRadius: "5px",
      backgroundColor: "#28A745",
      color: "#fff",
      border: "none",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <h1>YouTube Video Arama ve Yorumlar</h1>

      <div>
        <input
          type="text"
          placeholder="Arama yapın..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
        />
        <button onClick={searchVideos} style={styles.button}>
          Ara
        </button>
      </div>

      {loading && <p>Yükleniyor...</p>}

      <div>
        <h2>Videolar</h2>
        <ul style={styles.videoList}>
          {videos.map((video) => (
            <li key={video.id.videoId} style={styles.videoItem}>
              <button
                onClick={() => {
                  setSelectedVideo(video);
                  fetchComments(video.id.videoId);
                }}
                style={styles.button}
              >
                {video.snippet.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedVideo && (
        <div>
          <h2>Video: {selectedVideo.snippet.title}</h2>
          <p>Yayınlanma Tarihi: {selectedVideo.snippet.publishedAt}</p>
          <h3>Yorumlar</h3>
          <div style={styles.comments}>
            {comments.slice(0, 15).map((comment) => (
              <div key={comment.id} style={styles.comment}>
                <p>
                  <strong>
                    {comment.snippet.topLevelComment.snippet.authorDisplayName}
                  </strong>{" "}
                  - {comment.snippet.topLevelComment.snippet.publishedAt}
                </p>
                <p>{comment.snippet.topLevelComment.snippet.textDisplay}</p>
                <p>Beğeni Sayısı: {comment.snippet.topLevelComment.snippet.likeCount}</p>
              </div>
            ))}
          </div>
          <button onClick={downloadCSV} style={styles.downloadButton}>
            CSV Olarak İndir
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
