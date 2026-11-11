import React from "react";

export default function App() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      fontFamily: "sans-serif",
      backgroundColor: "#f8fafc",
      color: "#1e293b",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{ 
        maxW: "600px", 
        background: "white", 
        padding: "40px", 
        borderRadius: "12px", 
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" 
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
          🚀 웹사이트가 성공적으로 배포되었습니다!
        </h1>
        <p style={{ color: "#64748b", marginBottom: "24px", lineHeight: "1.5" }}>
          Manus 프로젝트가 Cloudflare Pages에 안정적으로 이관되었습니다.
        </p>
        <div style={{ 
          padding: "12px 20px", 
          backgroundColor: "#e2e8f0", 
          borderRadius: "6px", 
          display: "inline-block",
          fontWeight: "500",
          fontSize: "14px"
        }}>
          Status: Online & Ready (1년 이상 안정 운영 모드)
        </div>
      </div>
    </div>
  );
}

