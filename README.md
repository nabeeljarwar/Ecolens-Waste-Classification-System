# 🌿 EcoLens: AI-Powered Smart Campus Initiative
### *Driving Sustainability at MUET Jamshoro through Edge Intelligence*

**EcoLens** is a sophisticated AI-driven application developed to facilitate the transition of MUET Jamshoro into a "Zero-Waste" Smart Campus. By utilizing on-device Machine Learning, EcoLens provides students and faculty with real-time waste classification and directs them to the nearest specialized disposal units across the campus.



---

## 🎯 The Vision: A Smarter, Greener MUET
MUET Jamshoro features a sprawling campus with diverse waste generation points. EcoLens addresses the challenges of waste segregation with a decentralized technical approach:
- **Zero-Latency Classification:** AI inference is performed locally in the browser, removing the dependency on high-bandwidth campus Wi-Fi for server-side processing.
- **Strategic Campus Mapping:** Integrated guidance system for smart bins located at key MUET landmarks, including the Central Library and the Student Cafeteria.
- **Inclusive Edge AI:** Specifically optimized to run on hardware-constrained devices (e.g., 4GB RAM), ensuring accessibility for the entire MUET community.

---

## 🛠 Tech Stack
- **Frontend:** React.js + Vite + Tailwind CSS
- **AI/ML:** TensorFlow.js + Custom TFLite Model (MobileNetV2)
- **Database/Auth:** Supabase (BaaS)
- **Deployment:** Vercel

## 🌟 Technical Highlights for Hackathon Judges
1. **Edge Computing Architecture:** By performing browser-side inference, the system ensures 100% data privacy and achieves a $0 operational cost for server-side GPU resources.
2. **Resource Optimization:** Despite being developed on mid-tier hardware, the application maintains high performance through strategic CDN utilization and deferred loading of heavy ML assets.
3. **Data-Driven Sustainability:** Every successful classification is logged in the MUET sustainability dashboard (via Supabase), enabling the collection of campus-wide recycling analytics.

---

## 🚀 Future Roadmap
- **IoT Smart Bin Integration:** Connecting physical bin sensors to the dashboard for real-time fill-level monitoring.
- **Departmental Leaderboards:** Gamifying sustainability to foster healthy competition between Engineering Departments (CS, EE, ME, etc.).
- **PWA Implementation:** Enhancing offline capabilities to ensure classification remains functional regardless of campus connectivity.

---
**Developed with a commitment to MUET Jamshoro's sustainable future.**
