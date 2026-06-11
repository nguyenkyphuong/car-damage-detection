import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import api from "./api/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
      Boolean(localStorage.getItem("token"))
  );

  const [showLogin, setShowLogin] = useState(false);

  const [page, setPage] = useState("detect");

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState("newest");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const chartColors = [
      "#60a5fa",
      "#93c5fd",
      "#bfdbfe",
      "#2563eb",
      "#38bdf8",
      "#818cf8",
  ];

  const handleLogin = async (e) => {
      e.preventDefault();

      try {
        const res = await api.post("/login", {
          username,
          password,
        });

        localStorage.setItem(
          "token",
          res.data.access_token
        );

        setIsLoggedIn(true);
        setShowLogin(false);

        // reset màn hình detect
        setSelectedFile(null);
        setPreviewImage(null);
        setResult(null);

        setMessage("");

        // load lại dữ liệu admin
        await loadHistory();
        await loadStats();

      } catch (error) {
        console.error(error);

        setMessage(
          "Sai tài khoản hoặc mật khẩu"
        );
      }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setShowLogin(false);
    setPage("detect");
  };

  const handleAuthError = (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setPage("detect");
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return true;
      }

      return false;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn ảnh trước khi phát hiện.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);

      const res = await api.post("/detect", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi phát hiện hư hỏng.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
        setHistoryLoading(true);
        const res = await api.get("/history");
        setHistory(res.data);
    } catch (err) {
      console.error(err);

      if (handleAuthError(err)) return;

      alert("Không thể tải lịch sử kiểm tra.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredHistory = history
      .filter((item) =>
        (item.damage_type || "")
          .toLowerCase()
          .includes(historySearch.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);

        return historySort === "newest"
          ? dateB - dateA
          : dateA - dateB;
      });

  const loadStats = async () => {
      try {
        setStatsLoading(true);
        const res = await api.get("/stats");
        setStats(res.data);
      } catch (err) {
      console.error(err);

      if (handleAuthError(err)) return;

      alert("Không thể tải dữ liệu thống kê.");
    } finally {
      setStatsLoading(false);
    }
  };


  if (showLogin && !isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.bgCircle1}></div>
        <div style={styles.bgCircle2}></div>
        <div style={styles.dotsLeft}></div>
        <div style={styles.dotsRight}></div>

        <div style={styles.loginCard}>
          <div style={styles.iconBox}>🚘</div>

          <h1 style={styles.title}>
            <span style={styles.titleBlue}>Car Damage</span> Detection System
          </h1>

          <div style={styles.decor}>
            <span style={styles.line}></span>
            <span style={styles.dot}></span>
            <span style={styles.line}></span>
          </div>

          <p style={styles.subtitle}>
            Hệ thống phát hiện hư hỏng xe ô tô bằng YOLOv8
          </p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <span style={styles.smallIcon}>👤</span>
                <label style={styles.label}>Username</label>
              </div>

              <input
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.labelRow}>
                <span style={styles.smallIcon}>🔒</span>
                <label style={styles.label}>Password</label>
              </div>

              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && <p style={styles.error}>{message}</p>}

            <button style={styles.loginButton} type="submit">
              Đăng nhập →
            </button>

            <div style={styles.footerText}>
              Chỉ quản trị viên được ủy quyền mới có thể truy cập
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            🛡️
          </div>

          <div>
            <div style={styles.logoTitle}>
              Car Damage AI
            </div>

            <div style={styles.logoSubtitle}>
              Detection System
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(page === "detect"
                ? styles.navButtonActive
                : {}),
            }}
            onClick={() => setPage("detect")}
          >
            🔍 Phát hiện hư hỏng
          </button>

          <button
              style={{
                ...styles.navButton,
                ...(page === "history" ? styles.navButtonActive : {}),
              }}
              onClick={() => {
                setPage("history");

                if (isLoggedIn) {
                  loadHistory();
                }
              }}
            >
              📋 Lịch sử kiểm tra
            </button>

          <button
              style={{
                ...styles.navButton,
                ...(page === "dashboard"
                  ? styles.navButtonActive
                  : {}),
              }}
              onClick={() => {
                setPage("dashboard");

                if (isLoggedIn) {
                  loadStats();
                }
              }}
            >
              📊 Dashboard
          </button>

          <button
              style={{
                ...styles.navButton,
                ...(page === "about" ? styles.navButtonActive : {}),
              }}
              onClick={() => setPage("about")}
            >
              ℹ️ Giới thiệu hệ thống
          </button>
        </nav>

        {isLoggedIn ? (
          <button style={styles.logoutButton} onClick={handleLogout}>
            Đăng xuất
          </button>
        ) : (
          <button
            style={styles.logoutButton}
            onClick={() => setShowLogin(true)}
          >
            Đăng nhập Admin
          </button>
        )}
      </aside>

      <main style={styles.main}>
        {page === "detect" && (
          <section>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Phát hiện hư hỏng xe</h1>
                <p style={styles.pageDescription}>
                  Tải ảnh xe lên để hệ thống YOLOv8 phát hiện loại hư hỏng có độ tin cậy cao nhất.
                </p>
              </div>
            </div>

            <div style={styles.detectGrid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Upload ảnh</h3>

                <label style={styles.uploadBox}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                  />

                  <div style={styles.uploadIcon}>📷</div>
                  <p style={styles.uploadText}>
                    {selectedFile ? selectedFile.name : "Chọn ảnh xe cần kiểm tra"}
                  </p>
                  <span style={styles.uploadHint}>JPG, JPEG hoặc PNG</span>
                </label>

                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                )}

                <button
                  style={{
                    ...styles.detectButton,
                    opacity: loading ? 0.7 : 1,
                  }}
                  onClick={handleDetect}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Phát hiện hư hỏng"}
                </button>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Kết quả phát hiện</h3>

                {!result && (
                  <div style={styles.emptyResult}>
                    <div style={styles.emptyIcon}>🧠</div>
                    <p>Kết quả sẽ hiển thị tại đây sau khi hệ thống xử lý ảnh.</p>
                  </div>
                )}

                {result && (
                  <div>
                    <div style={styles.resultSummary}>
                      <div>
                        <span style={styles.resultLabel}>Loại hư hỏng</span>
                        <h2 style={styles.resultValue}>
                          {result.predicted_damage?.damage_type || "Không phát hiện"}
                        </h2>
                      </div>

                      <div>
                        <span style={styles.resultLabel}>Độ tin cậy</span>
                        <h2 style={styles.resultValue}>
                          {result.predicted_damage
                            ? `${Math.round(
                                result.predicted_damage.confidence * 100
                              )}%`
                            : "0%"}
                        </h2>
                      </div>
                    </div>

                    <img
                      src={`http://127.0.0.1:8000${result.result_image}`}
                      alt="Detection result"
                      style={styles.resultImage}
                    />

                    <p style={styles.saveStatus}>
                      {result.saved_to_history
                        ? "✅ Kết quả đã được lưu vào lịch sử và thống kê."
                        : "ℹ️ Bạn đang dùng chế độ khách. Kết quả không được lưu vào lịch sử."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {page === "history" && (
          !isLoggedIn ? (
            <div style={styles.card}>
              <h2>🔒 Cần đăng nhập</h2>

              <p>
                Bạn cần đăng nhập quản trị viên để xem
                lịch sử kiểm tra.
              </p>

              <button
                style={styles.detectButton}
                onClick={() => setShowLogin(true)}
              >
                Đăng nhập Admin
              </button>
            </div>
          ) : (
          <section>
            <h1 style={styles.pageTitle}>Lịch sử kiểm tra</h1>
            <p style={styles.pageDescription}>
              Danh sách các lần phát hiện hư hỏng đã được lưu trong cơ sở dữ liệu.
            </p>

            <div style={styles.historyToolbar}>
              <input
                style={styles.searchInput}
                placeholder="Tìm theo loại hư hỏng..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />

              <select
                style={styles.sortSelect}
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>

            {historyLoading && <p>Đang tải lịch sử...</p>}

            {!historyLoading && filteredHistory.length === 0 && (
              <div style={styles.card}>
                <p>Chưa có dữ liệu lịch sử.</p>
              </div>
            )}

            <div style={styles.historyGrid}>
              {filteredHistory.map((item) => (
                <div key={item.id} style={styles.historyCard}>
                  <img
                    src={`http://127.0.0.1:8000${item.result_image}`}
                    alt="History result"
                    style={styles.historyImage}
                  />

                  <div style={styles.historyContent}>
                    <h3 style={styles.historyTitle}>
                      {item.damage_type || "Không phát hiện"}
                    </h3>

                    <p style={styles.historyText}>
                      Độ tin cậy:{" "}
                      <b>
                        {item.confidence
                          ? `${Math.round(item.confidence * 100)}%`
                          : "0%"}
                      </b>
                    </p>

                    <p style={styles.historyText}>
                      Thời gian: {item.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )
        )}

        {page === "dashboard" && (
          !isLoggedIn ? (
            <div style={styles.card}>
              <h2>🔒 Cần đăng nhập</h2>
              <p>Bạn cần đăng nhập quản trị viên để xem dashboard thống kê.</p>

              <button
                style={styles.detectButton}
                onClick={() => setShowLogin(true)}
              >
                Đăng nhập Admin
              </button>
            </div>
          ) : (
            <section>
              <h1 style={styles.pageTitle}>Dashboard thống kê</h1>
              <p style={styles.pageDescription}>
                Theo dõi kết quả phát hiện hư hỏng, độ tin cậy trung bình của mô hình
                và xu hướng kiểm tra theo thời gian.
              </p>

              {statsLoading && <p>Đang tải thống kê...</p>}

              {stats && (
                <>
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <p style={styles.statLabel}>Tổng số lượt kiểm tra</p>
                      <h2 style={styles.statValue}>{stats.total_detections}</h2>
                    </div>

                    <div style={styles.statCard}>
                      <p style={styles.statLabel}>Độ tin cậy trung bình</p>
                      <h2 style={styles.statValue}>
                        {Math.round((stats.average_confidence || 0) * 100)}%
                      </h2>
                    </div>

                    <div style={styles.statCard}>
                      <p style={styles.statLabel}>Hư hỏng phổ biến nhất</p>
                      <h2 style={styles.statValueSmall}>
                        {stats.most_common_damage || "Chưa có"}
                      </h2>
                    </div>
                  </div>

                  <div style={styles.dashboardGrid}>
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>Damage Distribution</h3>

                      <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={Object.entries(stats.damage_by_type || {}).map(
                              ([name, value]) => ({
                                name,
                                value,
                              })
                            )}
                          >
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>Tỷ lệ từng loại hư hỏng</h3>

                      <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={stats.top_damage_types || []}
                              dataKey="count"
                              nameKey="name"
                              outerRadius={80}
                              label
                            >
                              {(stats.top_damage_types || []).map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={chartColors[index % chartColors.length]}
                                />
                              ))}
                            </Pie>

                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                      Xu hướng từng loại hư hỏng theo thời gian
                    </h3>

                    <div style={{ width: "100%", height: 360 }}>
                      <ResponsiveContainer>
                        <LineChart data={stats.damage_trend_over_time || []}>
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />

                          {(stats.damage_types || []).map((damage, index) => (
                            <Line
                              key={damage}
                              type="monotone"
                              dataKey={damage}
                              stroke={chartColors[index % chartColors.length]}
                              strokeWidth={3}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Top loại hư hỏng phổ biến</h3>

                    {(stats.top_damage_types || []).map((item, index) => (
                      <div key={item.name} style={styles.topDamageRow}>
                        <span style={styles.topDamageRank}>{index + 1}</span>

                        <div style={styles.topDamageInfo}>
                          <b>{item.name}</b>
                          <span>{item.count} lượt kiểm tra</span>
                        </div>

                        <strong>{item.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )
        )}
        {page === "about" && (
          <section>
            <h1 style={styles.pageTitle}>Giới thiệu hệ thống</h1>
            <p style={styles.pageDescription}>
              Car Damage Detection System là website hỗ trợ phát hiện hư hỏng xe ô tô
              từ hình ảnh bằng mô hình YOLOv8.
            </p>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                Mục tiêu hệ thống
              </h3>

              <p style={styles.pageDescription}>
                Hệ thống được xây dựng nhằm hỗ trợ phát hiện nhanh các hư hỏng trên xe ô tô từ hình ảnh bằng trí tuệ nhân tạo.
                Người dùng có thể tải ảnh lên để nhận kết quả dự đoán loại hư hỏng cùng độ tin cậy tương ứng.
                Ngoài ra, hệ thống còn hỗ trợ lưu lịch sử kiểm tra và thống kê dữ liệu phục vụ công tác quản lý.
              </p>
            </div>

            <div style={styles.aboutGrid}>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Chức năng chính</h3>
                <ul style={styles.aboutList}>
                  <li>Upload ảnh xe ô tô</li>
                  <li>Phát hiện loại hư hỏng chính</li>
                  <li>Hiển thị ảnh kết quả có bounding box</li>
                  <li>Lưu lịch sử kiểm tra cho quản trị viên</li>
                  <li>Thống kê số lượng hư hỏng theo từng loại</li>
                </ul>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Quy trình xử lý</h3>
                <p style={styles.pageDescription}>
                  Người dùng tải ảnh lên hệ thống. Backend nhận ảnh và đưa vào mô hình
                  YOLOv8 để phát hiện hư hỏng. Kết quả dự đoán có độ tin cậy cao nhất
                  được hiển thị trên giao diện. Nếu người dùng là quản trị viên, kết quả
                  sẽ được lưu vào cơ sở dữ liệu để phục vụ lịch sử và thống kê.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  loginPage: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eaf5ff 0%, #f7fbff 45%, #dbeafe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },

  bgCircle1: {
    position: "absolute",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(147, 197, 253, 0.35)",
    top: "-80px",
    right: "-70px",
  },

  bgCircle2: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "rgba(191, 219, 254, 0.45)",
    bottom: "-130px",
    left: "-120px",
  },

  dotsLeft: {
    position: "absolute",
    width: "120px",
    height: "120px",
    left: "34px",
    top: "110px",
    opacity: 0.45,
    backgroundImage: "radial-gradient(#60a5fa 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },

  dotsRight: {
    position: "absolute",
    width: "120px",
    height: "120px",
    right: "48px",
    bottom: "90px",
    opacity: 0.35,
    backgroundImage: "radial-gradient(#3b82f6 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },

  loginCard: {
    width: "600px",
    maxWidth: "92vw",
    background: "rgba(255,255,255,0.94)",
    borderRadius: "28px",
    padding: "36px 52px",
    boxShadow: "0 22px 60px rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(147, 197, 253, 0.35)",
    backdropFilter: "blur(18px)",
    position: "relative",
    zIndex: 2,
  },

  iconBox: {
    width: "58px",
    height: "58px",
    margin: "0 auto 18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #bfdbfe, #60a5fa, #6366f1)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 12px 26px rgba(59, 130, 246, 0.28)",
  },

  title: {
    margin: 0,
    textAlign: "center",
    fontSize: "32px",
    lineHeight: 1.15,
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: "-1px",
  },

  titleBlue: {
    color: "#3b82f6",
  },

  decor: {
    margin: "16px auto 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  line: {
    width: "54px",
    height: "3px",
    borderRadius: "99px",
    background: "#93c5fd",
  },

  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#3b82f6",
  },

  subtitle: {
    color: "#64748b",
    textAlign: "center",
    margin: "0 0 32px",
    fontSize: "16px",
    fontWeight: 400,
  },

  form: {
    width: "100%",
  },

  formGroup: {
    marginBottom: "18px",
  },

  labelRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },

  smallIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  label: {
    color: "#334155",
    fontWeight: 700,
    fontSize: "16px",
  },

  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1.5px solid #bfdbfe",
    fontSize: "16px",
    color: "#0f172a",
    outline: "none",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(148, 163, 184, 0.12)",
  },

  loginButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background:
        "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 14px 26px rgba(37, 99, 235, 0.28)",
  },

  error: {
    color: "#ef4444",
    textAlign: "center",
    margin: "-6px 0 18px",
    fontWeight: 500,
  },

  footerText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: "28px",
    fontSize: "14px",
  },

  app: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Poppins', sans-serif",
    background: "#f4f8ff",
  },

  sidebar: {
    width: "270px",
    background: "linear-gradient(180deg, #edf5ff 0%, #bfdcff 100%)",
    color: "#1e293b",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #bfdbfe",
  },

  logo: {
    margin: "0 0 4px",
    fontSize: "24px",
  },

  sidebarSub: {
    margin: "0 0 34px",
    color: "#64748b",
    fontSize: "13px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  navButton: {
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid transparent",
    background: "rgba(255,255,255,0.7)",
    color: "#334155",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },

  navButtonActive: {
    background: "#ffffff",
    border: "1px solid #93c5fd",
    color: "#2563eb",
    boxShadow: "0 10px 24px rgba(59, 130, 246, 0.12)",
  },

  logoutButton: {
    marginTop: "auto",
    padding: "13px",
    borderRadius: "14px",
    border: "none",
    background:
        "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },

  main: {
    flex: 1,
    padding: "36px",
    overflowY: "auto",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "26px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#1e293b",
  },

  pageDescription: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
  },

  detectGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 18px 50px rgba(59, 130, 246, 0.10)",
    border: "1px solid #dbeafe",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#1e293b",
    fontSize: "20px",
  },

  uploadBox: {
    border: "2px dashed #93c5fd",
    borderRadius: "18px",
    background: "#eff6ff",
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    cursor: "pointer",
    padding: "24px",
  },

  fileInput: {
    display: "none",
  },

  uploadIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  uploadText: {
    margin: "4px 0",
    fontWeight: 700,
    color: "#1e293b",
  },

  uploadHint: {
    color: "#64748b",
    fontSize: "13px",
  },

  previewImage: {
    width: "100%",
    maxHeight: "260px",
    objectFit: "contain",
    borderRadius: "16px",
    marginTop: "20px",
    border: "1px solid #dbeafe",
  },

  detectButton: {
    width: "100%",
    marginTop: "20px",
    padding: "15px",
    border: "none",
    borderRadius: "16px",
    background:
        "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyResult: {
    minHeight: "360px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    textAlign: "center",
    color: "#64748b",
    padding: "24px",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  resultSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "18px",
  },

  resultLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 600,
  },

  resultValue: {
    margin: "6px 0 0",
    color: "#2563eb",
    fontSize: "26px",
  },

  resultImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    borderRadius: "16px",
    border: "1px solid #dbeafe",
    background: "#f8fafc",
  },

  historyGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "20px",
      marginTop: "24px",
  },

  historyCard: {
      background: "#ffffff",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 18px 50px rgba(59, 130, 246, 0.10)",
      border: "1px solid #dbeafe",
  },

  historyImage: {
      width: "100%",
      height: "190px",
      objectFit: "contain",
      background: "#f8fafc",
      borderBottom: "1px solid #dbeafe",
  },

  historyContent: {
      padding: "18px",
  },

  historyTitle: {
      margin: "0 0 10px",
      color: "#2563eb",
      fontSize: "22px",
  },

  historyText: {
      margin: "6px 0",
      color: "#475569",
      fontSize: "14px",
  },
  statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "20px",
      marginTop: "24px",
      marginBottom: "24px",
    },

  statCard: {
      background: "#ffffff",
      borderRadius: "20px",
      padding: "24px",
      border: "1px solid #dbeafe",
      boxShadow: "0 18px 50px rgba(59, 130, 246, 0.10)",
  },

  statLabel: {
      margin: 0,
      color: "#64748b",
      fontSize: "14px",
      fontWeight: 600,
  },

  statValue: {
      margin: "10px 0 0",
      color: "#2563eb",
      fontSize: "36px",
  },
  saveStatus: {
      marginTop: "14px",
      padding: "12px 14px",
      borderRadius: "12px",
      background: "#eff6ff",
      color: "#2563eb",
      fontSize: "14px",
      fontWeight: 600,
  },

  aboutGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "22px",
      marginTop: "24px",
  },

  aboutList: {
      margin: 0,
      paddingLeft: "20px",
      color: "#475569",
      lineHeight: 1.9,
      fontSize: "15px",
  },
  historyToolbar: {
      display: "flex",
      gap: "14px",
      marginTop: "24px",
      marginBottom: "20px",
  },

  searchInput: {
      flex: 1,
      padding: "13px 16px",
      borderRadius: "14px",
      border: "1px solid #bfdbfe",
      outline: "none",
      fontSize: "15px",
      background: "#ffffff",
      color: "#1e293b",
  },

  sortSelect: {
      width: "120px",
      paddingLeft: "12px",
      paddingRight: "20px",
      borderRadius: "14px",
      border: "1px solid #bfdbfe",
      outline: "none",
      fontSize: "15px",
      background: "#ffffff",
      color: "#1e293b",
      cursor: "pointer",
    },

    logoContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "30px",
    },

    logoIcon: {
      width: "45px",
      height: "40px",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      borderRadius: "14px",

      background:
        "linear-gradient(135deg,#dbeafe,#93c5fd)",

      color: "white",

      fontSize: "26px",

      boxShadow:
        "0 8px 20px rgba(37,99,235,0.25)",
    },

    logoTitle: {
      fontSize: "22px",
      fontWeight: 800,
      color: "#1e293b",
      whiteSpace: "nowrap",
    },

    logoSubtitle: {
      fontSize: "13px",
      color: "#64748b",
      marginTop: "2px",
    },

    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },

    statValueSmall: {
      margin: "10px 0 0",
      color: "#2563eb",
      fontSize: "24px",
      fontWeight: 800,
    },

    topDamageRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "14px 0",
      borderBottom: "1px solid #e2e8f0",
    },

    topDamageRank: {
      width: "34px",
      height: "34px",
      borderRadius: "12px",
      background: "#dbeafe",
      color: "#2563eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
    },

    topDamageInfo: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      color: "#1e293b",
    },
};

export default App;