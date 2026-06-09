// app/(tabs)/blast/index.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, FontFamily, Shadow } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Location from "expo-location"; 

type Screen = "dash" | "input" | "results" | "trend" | "history" | "profile" | "notif";

interface BlastEvent {
  id: string;
  eventName: string;
  blastLocation: string;
  date: string;
  time: string;
  explosiveType: string;
  holeDepth: number;
  chargePerHole: number;
  holesDelay: number;
  distance: number;
  kConstant: number;
  alphaConstant: number;
  cpd: number;
  scaledDistance: number;
  ppv: number;
  status: "planned" | "in-progress" | "completed";
  createdAt?: any;
}

export default function BlastingPlannerScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Navigation Sub-system
  const [activeScreen, setActiveScreen] = useState<Screen>("dash");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  // Site constants settings — loaded from Firestore on mount
  const [defaultK, setDefaultK] = useState("");
  const [defaultAlpha, setDefaultAlpha] = useState("");
  const [siteLocation, setSiteLocation] = useState("");

  // Local/remote state variables
  const [blastEvents, setBlastEvents] = useState<BlastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsCoords, setGpsCoords] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Input states for New Blast Form — no prefilled fake values
  const [blastLocation, setBlastLocation] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [explosiveType, setExplosiveType] = useState("ANFO");
  const [holeDepth, setHoleDepth] = useState("");
  const [chargePerHole, setChargePerHole] = useState("");
  const [holesDelay, setHolesDelay] = useState("");
  const [distanceToTarget, setDistanceToTarget] = useState("");

  // Real-time calculation previews — start at zero
  const [cpdPreview, setCpdPreview] = useState(0);
  const [_ppvPreview, setPpvPreview] = useState(0);
  const [_sdPreview, setSdPreview] = useState(0);

  // Viewing specific results details
  const [selectedEvent, setSelectedEvent] = useState<BlastEvent | null>(null);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState<"7D" | "30D" | "All">("All");

  // Profile preferences
  const [darkMode, setDarkMode] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  // Slide hamburger menu animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 250,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen]);

  // Set default dates/times on mount
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setDateStr(`${dd}/${mm}/${yyyy}`);

    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    setTimeStr(`${hh}:${min}`);
  }, []);

  // Fetch user profile constants & blast events on mount / auth state change
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadBlastEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recalculate parameters in real-time as user fills form
  useEffect(() => {
    const q = parseFloat(chargePerHole) || 0;
    const n = parseFloat(holesDelay) || 0;
    const d = parseFloat(distanceToTarget) || 0;
    const k = parseFloat(defaultK) || 682;
    const a = parseFloat(defaultAlpha) || 1.6;

    const computedCpd = q * n;
    setCpdPreview(Math.round(computedCpd * 10) / 10);

    if (computedCpd > 0 && d > 0) {
      const computedSd = d / Math.sqrt(computedCpd);
      setSdPreview(Math.round(computedSd * 10) / 10);

      const computedPpv = k * Math.pow(computedSd, -a);
      setPpvPreview(Math.round(computedPpv * 10) / 10);
    } else {
      setSdPreview(0);
      setPpvPreview(0);
    }
  }, [chargePerHole, holesDelay, distanceToTarget, defaultK, defaultAlpha]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Restore site calibration constants
        if (data.defaultK != null) setDefaultK(data.defaultK.toString());
        if (data.defaultAlpha != null) setDefaultAlpha(data.defaultAlpha.toString());
        if (data.siteLocation) setSiteLocation(data.siteLocation);
        // Restore app preferences
        if (data.pushAlerts != null) setPushAlerts(Boolean(data.pushAlerts));
        if (data.darkMode != null) setDarkMode(Boolean(data.darkMode));
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    }
  };

  const loadBlastEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "blastingEvents"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const eventsList: BlastEvent[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        eventsList.push({
          id: d.id,
          eventName: data.eventName ?? "Blast Event",
          blastLocation: data.blastLocation ?? "Unknown Location",
          date: data.date ?? "—",
          time: data.time ?? "—",
          explosiveType: data.explosiveType ?? "—",
          holeDepth: data.holeDepth ?? 0,
          chargePerHole: data.chargePerHole ?? 0,
          holesDelay: data.holesDelay ?? 0,
          distance: data.distance ?? 0,
          kConstant: data.kConstant ?? 0,
          alphaConstant: data.alphaConstant ?? 0,
          cpd: data.cpd ?? 0,
          scaledDistance: data.scaledDistance ?? 0,
          ppv: data.ppv ?? 0,
          status: data.status ?? "completed",
        });
      });
      setBlastEvents(eventsList);
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Error loading events:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          defaultK: parseFloat(defaultK) || 682,
          defaultAlpha: parseFloat(defaultAlpha) || 1.6,
          siteLocation: siteLocation.trim(),
          pushAlerts,
          darkMode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert("Success", "Profile and preferences saved.");
    } catch (_e) {
      Alert.alert("Error", "Failed to update profile settings.");
    }
  };

  const captureGPSLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to capture blast site coordinates. Enable it in device settings."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = loc.coords.latitude.toFixed(6);
      const lon = loc.coords.longitude.toFixed(6);
      const coordStr = `${lat}, ${lon}`;
      setGpsCoords(coordStr);
      setGpsLocked(true);
      // Append real GPS coordinates to whichever location text the user entered
      if (blastLocation.trim()) {
        setBlastLocation(`${blastLocation.trim()} (${coordStr})`);
      } else {
        setBlastLocation(coordStr);
      }
    } catch (e) {
      Alert.alert("GPS Error", "Unable to retrieve device location. Ensure GPS is enabled.");
      console.error("GPS error:", e);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!user) return;
    const l = blastLocation.trim();
    const depth = parseFloat(holeDepth) || 0;
    const q = parseFloat(chargePerHole) || 0;
    const n = parseFloat(holesDelay) || 0;
    const dist = parseFloat(distanceToTarget) || 0;
    const k = parseFloat(defaultK) || 682;
    const a = parseFloat(defaultAlpha) || 1.6;

    if (!l) {
      Alert.alert("Validation", "Blast location is required.");
      return;
    }
    if (q <= 0 || n <= 0 || dist <= 0 || depth <= 0) {
      Alert.alert("Validation", "Parameters must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const computedCpd = q * n;
      const computedSd = dist / Math.sqrt(computedCpd);
      const computedPpv = k * Math.pow(computedSd, -a);

      const roundedCpd = Math.round(computedCpd * 10) / 10;
      const roundedSd = Math.round(computedSd * 10) / 10;
      const roundedPpv = Math.round(computedPpv * 10) / 10;

      const newEvent = {
        userId: user.uid,
        eventName: `Blast ${l.split(" ")[0]}`,
        blastLocation: l,
        date: dateStr,
        time: timeStr,
        explosiveType,
        holeDepth: depth,
        chargePerHole: q,
        holesDelay: n,
        distance: dist,
        kConstant: k,
        alphaConstant: a,
        cpd: roundedCpd,
        scaledDistance: roundedSd,
        ppv: roundedPpv,
        status: "completed" as const,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "blastingEvents"), newEvent);

      const addedEvent: BlastEvent = {
        id: docRef.id,
        ...newEvent,
      };

      setBlastEvents((prev) => [addedEvent, ...prev]);
      setSelectedEvent(addedEvent);
      setActiveScreen("results");
    } catch (e: any) {
      Alert.alert("Save Error", e.message || "Failed to record blast to Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  const exportEventPDF = async (ev: BlastEvent) => {
    let tier = "SAFE";
    let tierColor = "#166534";
    if (ev.ppv >= 50.0) {
      tier = "CRITICAL RISK";
      tierColor = "#991B1B";
    } else if (ev.ppv >= 19.0) {
      tier = "HAZARD ALERT";
      tierColor = "#9A3412";
    }

    const htmlMarkup = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Blast Compliance Engineering Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 30px; line-height: 1.5; }
            .header { border-bottom: 3px solid #0F172A; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0F172A; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 12px; color: #64748B; letter-spacing: 1px; text-transform: uppercase; margin-top: 5px; }
            .meta-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .hero-metric { background-color: #0F172A; color: #FFFFFF; text-align: center; padding: 30px; border-radius: 12px; margin-bottom: 25px; }
            .hero-val { font-size: 52px; font-weight: bold; color: #F59E0B; margin: 0; }
            .hero-unit { font-size: 16px; color: #94A3B8; }
            .status-bar { padding: 12px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 25px; font-size: 14px; color: #FFFFFF; background-color: ${tierColor}; }
            .grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; }
            .card { flex: 1; min-width: 45%; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; }
            .card-lbl { font-size: 10px; color: #64748B; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .card-val { font-size: 18px; font-weight: bold; color: #0F172A; }
            .formula-box { background-color: #FAFAFA; border-left: 4px solid #64748B; padding: 15px; font-family: monospace; font-size: 13px; margin-top: 30px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">BlastGuard Compliance Analysis</h1>
            <div class="subtitle">Predictive Wave Vibration Technical Outcome Report</div>
          </div>
          <div class="meta-box">
            <strong>Blast Site Target Location:</strong> ${ev.blastLocation}<br/>
            <strong>Operation Timestamp Date:</strong> ${ev.date} ${ev.time}<br/>
            <strong>Explosive Formulation Type:</strong> ${ev.explosiveType}
          </div>
          <div class="hero-metric">
            <div class="hero-lbl" style="font-size: 11px; letter-spacing: 1px; color: #94A3B8;">PREDICTED PEAK PARTICLE VELOCITY</div>
            <div class="hero-val">${ev.ppv.toFixed(2)}<span class="hero-unit"> mm/s</span></div>
          </div>
          <div class="status-bar">
            STRUCTURAL EVALUATION TIER STATUS: ${tier}
          </div>
          <div class="grid">
            <div class="card">
              <div class="card-lbl">Charge Per Delay (CPD)</div>
              <div class="card-val">${ev.cpd.toFixed(1)} kg</div>
            </div>
            <div class="card">
              <div class="card-lbl">Scaled Distance (SD)</div>
              <div class="card-val">${ev.scaledDistance.toFixed(2)} m/vkg</div>
            </div>
            <div class="card">
              <div class="card-lbl">Site Regression Constant (K)</div>
              <div class="card-val">${ev.kConstant}</div>
            </div>
            <div class="card">
              <div class="card-lbl">Attenuation Exponent (alpha)</div>
              <div class="card-val">${ev.alphaConstant}</div>
            </div>
          </div>
          <div class="formula-box">
            <strong>MATHEMATICAL ATTENUATION BREAKDOWN:</strong><br/><br/>
            1. CPD Formula: ${ev.chargePerHole.toFixed(1)} kg × ${ev.holesDelay} holes = ${ev.cpd.toFixed(1)} kg<br/>
            2. SD Formula: ${ev.distance}m / √${ev.cpd.toFixed(1)}kg = ${ev.scaledDistance.toFixed(2)} m/vkg<br/>
            3. PPV Formula: ${ev.kConstant} × (${ev.scaledDistance.toFixed(2)})^-${ev.alphaConstant} = <strong>${ev.ppv.toFixed(2)} mm/s</strong>
          </div>
          <div class="footer">
            Disclaimer: Calculations are indicative predictive metrics only. Report Compiled Digitally by BlastGuard Wave Prediction Matrices Systems.
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlMarkup });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Blast Wave Report" });
      } else {
        Alert.alert("System Notification", "File generated successfully context path: " + uri);
      }
    } catch (_err) {
      Alert.alert("System Error Alert", "Failed to properly generate and export PDF file report metrics.");
    }
  };

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    router.replace("/(auth)/login");
  };

  // Helper stats for dashboard calculations
  const getTodayStats = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    const todayEvents = blastEvents.filter((ev) => ev.date === todayStr);

    const count = todayEvents.length;
    let totalPpv = 0;
    let maxCpd = 0;
    let violations = 0;

    todayEvents.forEach((ev) => {
      const p = ev.ppv;
      const c = ev.cpd;
      totalPpv += p;
      if (c > maxCpd) maxCpd = c;
      if (p >= 19.0) violations += 1;
    });

    const avgPpv = count > 0 ? parseFloat((totalPpv / count).toFixed(1)) : 0.0;
    return { count, avgPpv, maxCpd, violations };
  };

  const todayStats = getTodayStats();

  const getFilteredTrendsData = () => {
    let filtered = [...blastEvents];
    const now = new Date();

    if (trendFilter === "7D") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter((ev) => {
        const [d, m, y] = ev.date.split("/").map(Number);
        const evDate = new Date(y, m - 1, d);
        return evDate >= sevenDaysAgo;
      });
    } else if (trendFilter === "30D") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = filtered.filter((ev) => {
        const [d, m, y] = ev.date.split("/").map(Number);
        const evDate = new Date(y, m - 1, d);
        return evDate >= thirtyDaysAgo;
      });
    }

    // Sort chronologically for trends visualization
    return filtered.reverse();
  };

  const getFilteredHistory = () => {
    let list = [...blastEvents];
    if (searchQuery.trim() !== "") {
      const queryLower = searchQuery.toLowerCase();
      list = list.filter(
        (ev) =>
          ev.blastLocation.toLowerCase().includes(queryLower) ||
          ev.explosiveType.toLowerCase().includes(queryLower) ||
          ev.date.includes(queryLower)
      );
    }
    return list;
  };

  const getRiskDetails = (ppv: number) => {
    if (ppv >= 50.0) {
      return {
        label: "CRITICAL RISK",
        color: Colors.high,
        bg: "rgba(255, 68, 102, 0.08)",
        border: "rgba(255, 68, 102, 0.2)",
        text: "Critical warning flag active! Severe structural cracks probable. Drop charge arrays.",
        icon: "⚠️",
      };
    } else if (ppv >= 19.0) {
      return {
        label: "HAZARD ALERT",
        color: Colors.moderate,
        bg: "rgba(255, 140, 0, 0.08)",
        border: "rgba(255, 140, 0, 0.2)",
        text: "Vibrations border architectural tolerances. Drop delay configurations.",
        icon: "⚠",
      };
    } else {
      return {
        label: "SAFE",
        color: Colors.safe,
        bg: "rgba(0, 212, 138, 0.08)",
        border: "rgba(0, 212, 138, 0.2)",
        text: "PPV is within acceptable limits. Blast can proceed safely at this range.",
        icon: "✓",
      };
    }
  };

  // Switch display pages
  const goScreen = (scr: Screen) => {
    setActiveScreen(scr);
    setSidebarOpen(false);
  };

  // Rendering Functions
  const renderSidebar = () => {
    const userInitials = user?.displayName
      ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
      : (user?.email ? user.email.slice(0, 2).toUpperCase() : "BE");

    return (
      <Modal visible={sidebarOpen} transparent animationType="none">
        <TouchableOpacity
          activeOpacity={1}
          style={S.sidebarOverlay}
          onPress={() => setSidebarOpen(false)}
        >
          <Animated.View
            style={[S.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <View style={S.sidebarHeader}>
                <Text style={S.sidebarBrandTitle}>BLASTGUARD</Text>
                <Text style={S.sidebarBrandSub}>MINING SAFETY SYSTEM v1.0</Text>
              </View>

              <View style={S.sidebarUserCard}>
                <View style={S.sidebarAvatar}>
                  <Text style={S.sidebarAvatarTxt}>{userInitials}</Text>
                </View>
                <View style={S.sidebarUserInfo}>
                  <Text style={S.sidebarUserName} numberOfLines={1}>
                    {user?.displayName || "Blast Engineer"}
                  </Text>
                  <Text style={S.sidebarUserRole}>{siteLocation.toUpperCase()}</Text>
                </View>
              </View>

              <ScrollView style={S.sidebarMenu}>
                <SidebarMenuItem
                  label="Dashboard"
                  icon="📊"
                  active={activeScreen === "dash"}
                  onPress={() => goScreen("dash")}
                />
                <SidebarMenuItem
                  label="New Blast"
                  icon="💥"
                  active={activeScreen === "input"}
                  onPress={() => goScreen("input")}
                />
                <SidebarMenuItem
                  label="Blast History"
                  icon="🗂️"
                  active={activeScreen === "history"}
                  onPress={() => goScreen("history")}
                />
                <SidebarMenuItem
                  label="PPV Trends"
                  icon="📈"
                  active={activeScreen === "trend"}
                  onPress={() => goScreen("trend")}
                />
                <SidebarMenuItem
                  label="Alerts"
                  icon="🔔"
                  active={activeScreen === "notif"}
                  onPress={() => goScreen("notif")}
                />
                <SidebarMenuItem
                  label="My Profile"
                  icon="👤"
                  active={activeScreen === "profile"}
                  onPress={() => goScreen("profile")}
                />
              </ScrollView>

              <View style={S.sidebarFooter}>
                <Text style={S.sidebarVersion}>
                  {lastSyncTime
                    ? `Synced ${lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Not synced yet"}
                </Text>
                <TouchableOpacity style={S.sidebarLogoutBtn} onPress={handleLogout}>
                  <Text style={S.sidebarLogoutIcon}>🚪</Text>
                  <Text style={S.sidebarLogoutTxt}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderHeader = (title: string, backScreen?: Screen) => {
    return (
      <View style={S.headerContainer}>
        {backScreen ? (
          <TouchableOpacity style={S.headerIconBtn} onPress={() => setActiveScreen(backScreen)}>
            <Text style={S.headerBackIcon}>◀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={S.headerIconBtn} onPress={() => setSidebarOpen(true)}>
            <View style={S.hamburger}>
              <View style={S.hamLine} />
              <View style={[S.hamLine, { width: 16 }]} />
              <View style={[S.hamLine, { width: 22 }]} />
            </View>
          </TouchableOpacity>
        )}

        <Text style={S.headerTitle}>{title}</Text>

        <TouchableOpacity style={S.headerActionCircle} onPress={() => setActiveScreen("notif")}>
          <Text style={{ fontSize: 16 }}>🔔</Text>
          <View style={S.headerNotificationDot} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderBottomNav = () => {
    return (
      <View style={S.bottomNav}>
        <BottomNavItem
          label="HOME"
          icon="house"
          active={activeScreen === "dash"}
          onPress={() => setActiveScreen("dash")}
        />
        <BottomNavItem
          label="BLAST"
          icon="flame"
          active={activeScreen === "input"}
          onPress={() => setActiveScreen("input")}
        />
        <BottomNavItem
          label="TRENDS"
          icon="chart"
          active={activeScreen === "trend"}
          onPress={() => setActiveScreen("trend")}
        />
        <BottomNavItem
          label="HISTORY"
          icon="history"
          active={activeScreen === "history"}
          onPress={() => setActiveScreen("history")}
        />
        <BottomNavItem
          label="PROFILE"
          icon="profile"
          active={activeScreen === "profile"}
          onPress={() => setActiveScreen("profile")}
        />
      </View>
    );
  };

  const renderDashboardScreen = () => {
    if (loading) {
      return (
        <View style={S.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={S.loadingText}>Syncing metrics with Firestore...</Text>
        </View>
      );
    }

    const hasViolations = blastEvents.some(
      (ev) => ev.date === new Date().toLocaleDateString("en-GB") && ev.ppv >= 19.0
    );

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        <View style={S.dashGreeting}>
          <Text style={S.dashGreetingTitle}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.displayName?.split(" ")[0] ||
              user?.email?.split("@")[0] ||
              "Engineer"}
          </Text>
          <Text style={S.dashGreetingSub}>
            {siteLocation || "BlastGuard"} · Blasting Planner
          </Text>
        </View>

        <View style={S.statusPillContainer}>
          <View style={[S.statusPill, hasViolations ? S.statusPillViol : S.statusPillSafe]}>
            <View style={S.pulseDot} />
            <Text style={[S.statusPillTxt, { color: hasViolations ? Colors.high : Colors.safe }]}>
              Site Status: {hasViolations ? "VIBRATION ALERT ACTIVE" : "ALL CLEAR"}
            </Text>
          </View>
        </View>

        {/* 2x2 Metric Cards Grid */}
        <View style={S.metricGrid}>
          <View style={S.metricRow}>
            <View style={S.metricCard}>
              <Text style={S.metricLabel}>TODAY&apos;S BLASTS</Text>
              <Text style={S.metricValue}>
                {todayStats.count}
                <Text style={S.metricUnit}> ops</Text>
              </Text>
              <Text style={S.metricChange}>Calculations logged</Text>
            </View>
            <View style={S.metricCard}>
              <Text style={S.metricLabel}>AVG PPV TODAY</Text>
              <Text style={S.metricValue}>
                {todayStats.avgPpv}
                <Text style={S.metricUnit}> mm/s</Text>
              </Text>
              <Text style={[S.metricChange, { color: todayStats.avgPpv >= 19.0 ? Colors.high : Colors.safe }]}>
                {todayStats.avgPpv >= 19.0 ? "⚠️ Exceeds limit" : "✓ Within limit"}
              </Text>
            </View>
          </View>
          <View style={S.metricRow}>
            <View style={S.metricCard}>
              <Text style={S.metricLabel}>MAX CPD</Text>
              <Text style={S.metricValue}>
                {todayStats.maxCpd}
                <Text style={S.metricUnit}> kg</Text>
              </Text>
              <Text style={S.metricChange}>Limit threshold: 120 kg</Text>
            </View>
            <View style={S.metricCard}>
              <Text style={S.metricLabel}>VIOLATIONS</Text>
              <Text style={[S.metricValue, { color: todayStats.violations > 0 ? Colors.high : Colors.text }]}>
                {todayStats.violations}
              </Text>
              <Text style={[S.metricChange, todayStats.violations > 0 && { color: Colors.high }]}>
                {todayStats.violations > 0 ? "⚠ Requires audit" : "No warnings today"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Drawer */}
        <View style={S.sectionHeaderContainer}>
          <Text style={S.sectionHeading}>Quick Actions</Text>
        </View>
        <View style={S.quickActionsGrid}>
          <View style={S.quickActionsRow}>
            <TouchableOpacity style={S.quickActionCard} onPress={() => goScreen("input")}>
              <Text style={S.quickActionIcon}>💥</Text>
              <Text style={S.quickActionTitle}>New Blast</Text>
              <Text style={S.quickActionSub}>Vibration modeling</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.quickActionCard} onPress={() => goScreen("trend")}>
              <Text style={S.quickActionIcon}>📈</Text>
              <Text style={S.quickActionTitle}>PPV Trends</Text>
              <Text style={S.quickActionSub}>Analysis chart</Text>
            </TouchableOpacity>
          </View>
          <View style={S.quickActionsRow}>
            <TouchableOpacity style={S.quickActionCard} onPress={() => goScreen("notif")}>
              <Text style={S.quickActionIcon}>🚨</Text>
              <Text style={S.quickActionTitle}>Alerts</Text>
              <Text style={S.quickActionSub}>Compliance log</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={S.quickActionCard} 
              onPress={() => {
                if (blastEvents.length > 0) {
                  exportEventPDF(blastEvents[0]);
                } else {
                  Alert.alert("No Data", "No blast events logged yet to export reports.");
                }
              }}
            >
              <Text style={S.quickActionIcon}>📄</Text>
              <Text style={S.quickActionTitle}>Reports</Text>
              <Text style={S.quickActionSub}>Export latest PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Blasts List */}
        <View style={S.sectionHeaderContainer}>
          <Text style={S.sectionHeading}>Recent Calculations</Text>
          <TouchableOpacity onPress={() => goScreen("history")}>
            <Text style={S.seeAllTxt}>See all</Text>
          </TouchableOpacity>
        </View>

        {blastEvents.slice(0, 3).map((item) => {
          const risk = getRiskDetails(item.ppv);
          return (
            <TouchableOpacity
              key={item.id}
              style={S.blastCard}
              onPress={() => {
                setSelectedEvent(item);
                setActiveScreen("results");
              }}
            >
              <View style={S.blastCardHeader}>
                <Text style={S.blastCardLocation}>{item.blastLocation.split("(")[0].trim()}</Text>
                <View style={[S.riskBadge, { backgroundColor: risk.bg }]}>
                  <Text style={[S.riskBadgeTxt, { color: risk.color }]}>{risk.label}</Text>
                </View>
              </View>
              <View style={S.blastCardStats}>
                <View style={S.blastStatBox}>
                  <Text style={[S.blastStatVal, { color: risk.color }]}>{item.ppv.toFixed(1)} mm/s</Text>
                  <Text style={S.blastStatLabel}>PPV</Text>
                </View>
                <View style={S.blastStatBox}>
                  <Text style={S.blastStatVal}>{item.cpd.toFixed(0)} kg</Text>
                  <Text style={S.blastStatLabel}>CPD</Text>
                </View>
                <View style={S.blastStatBox}>
                  <Text style={S.blastStatVal}>{item.distance} m</Text>
                  <Text style={S.blastStatLabel}>Distance</Text>
                </View>
                <Text style={S.blastCardTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {blastEvents.length === 0 && (
          <View style={S.emptyStateCard}>
            <Text style={S.emptyStateTxt}>No calculations recorded. Press &quot;New Blast&quot; to begin.</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderNewBlastScreen = () => {
    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={S.inputCard}>
          <Text style={S.inputCardTitle}>📍 Location & Time</Text>
          
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>BLAST LOCATION</Text>
            <TouchableOpacity
              style={[S.gpsBtn, gpsLoading && { opacity: 0.6 }]}
              onPress={captureGPSLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={S.gpsBtnTxt}>
                  {gpsLocked
                    ? `📡 GPS Locked · ${gpsCoords}`
                    : "📡 Capture Real GPS Coordinates"}
                </Text>
              )}
            </TouchableOpacity>
            {!gpsLocked && (
              <TextInput
                style={S.textInput}
                value={blastLocation}
                onChangeText={setBlastLocation}
                placeholder="e.g. Block C – Zone 4"
                placeholderTextColor={Colors.textPlaceholder}
              />
            )}
          </View>

          <View style={S.formRow}>
            <View style={[S.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={S.inputLabel}>DATE</Text>
              <TextInput
                style={S.textInput}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={Colors.textPlaceholder}
              />
            </View>
            <View style={[S.inputGroup, { flex: 1 }]}>
              <Text style={S.inputLabel}>TIME (24H)</Text>
              <TextInput
                style={S.textInput}
                value={timeStr}
                onChangeText={setTimeStr}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textPlaceholder}
              />
            </View>
          </View>
        </View>

        <View style={S.inputCard}>
          <Text style={S.inputCardTitle}>💣 Explosive Parameters</Text>
          
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>EXPLOSIVE FORMULATION</Text>
            <View style={S.explosiveSelectionRow}>
              {["ANFO", "Emulsion", "PETN", "ANFO + Emulsion"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[S.explosiveOption, explosiveType === type && S.explosiveOptionActive]}
                  onPress={() => setExplosiveType(type)}
                >
                  <Text style={[S.explosiveOptionTxt, explosiveType === type && S.explosiveOptionTxtActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={S.formRow}>
            <View style={[S.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={S.inputLabel}>HOLE DEPTH (m)</Text>
              <TextInput
                style={S.textInput}
                value={holeDepth}
                onChangeText={setHoleDepth}
                keyboardType="numeric"
              />
            </View>
            <View style={[S.inputGroup, { flex: 1 }]}>
              <Text style={S.inputLabel}>CHARGE / HOLE (kg)</Text>
              <TextInput
                style={S.textInput}
                value={chargePerHole}
                onChangeText={setChargePerHole}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={S.formRow}>
            <View style={[S.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={S.inputLabel}>HOLES / DELAY (N)</Text>
              <TextInput
                style={S.textInput}
                value={holesDelay}
                onChangeText={setHolesDelay}
                keyboardType="numeric"
              />
            </View>
            <View style={[S.inputGroup, { flex: 1 }]}>
              <Text style={S.inputLabel}>DISTANCE TO TARGET (m)</Text>
              <TextInput
                style={S.textInput}
                value={distanceToTarget}
                onChangeText={setDistanceToTarget}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={S.inputCard}>
          <Text style={S.inputCardTitle}>🔢 CPD Preview</Text>
          <View style={S.cpdPreviewBox}>
            <View>
              <Text style={S.cpdFormulaTxt}>CPD = q × N</Text>
              <Text style={S.cpdHelpTxt}>Auto-calculated</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={S.cpdPreviewVal}>{cpdPreview}</Text>
              <Text style={S.cpdPreviewUnit}> kg</Text>
            </View>
          </View>
        </View>

        <View style={S.inputCard}>
          <Text style={S.inputCardTitle}>⚙️ Site Constants</Text>
          <View style={S.formRow}>
            <View style={[S.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={S.inputLabel}>K CONSTANT</Text>
              <TextInput
                style={S.textInput}
                value={defaultK}
                onChangeText={setDefaultK}
                keyboardType="numeric"
              />
            </View>
            <View style={[S.inputGroup, { flex: 1 }]}>
              <Text style={S.inputLabel}>α EXPONENT</Text>
              <TextInput
                style={S.textInput}
                value={defaultAlpha}
                onChangeText={setDefaultAlpha}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={S.constantsWarningBox}>
            <Text style={S.constantsWarningTxt}>
              ⚠ Default coefficients are applied. Regress site seismograph arrays to refine constants for local geological formations.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={S.calcBtn} onPress={handleCalculate} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#02153A" />
          ) : (
            <Text style={S.calcBtnTxt}>CALCULATE PPV →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderResultsScreen = () => {
    const ev = selectedEvent;
    if (!ev) return null;

    const risk = getRiskDetails(ev.ppv);

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        <View style={S.resultsHeroCard}>
          <Text style={S.resultsHeroSub}>Predicted PPV</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={[S.resultsHeroVal, { color: risk.color }]}>{ev.ppv.toFixed(1)}</Text>
            <Text style={S.resultsHeroUnit}>mm/s</Text>
          </View>
          <Text style={S.resultsHeroMeta}>
            {ev.blastLocation.split("(")[0].trim()} · {ev.date} {ev.time}
          </Text>
        </View>

        {/* 2x2 Parameters Grid */}
        <View style={S.resultsGrid}>
          <View style={S.resultsGridRow}>
            <View style={S.resultsGridCard}>
              <Text style={S.resultsGridLabel}>CHARGE PER DELAY</Text>
              <Text style={S.resultsGridValue}>
                {ev.cpd.toFixed(0)} <Text style={S.resultsGridUnit}>kg</Text>
              </Text>
            </View>
            <View style={S.resultsGridCard}>
              <Text style={S.resultsGridLabel}>SCALED DISTANCE</Text>
              <Text style={S.resultsGridValue}>
                {ev.scaledDistance.toFixed(1)} <Text style={S.resultsGridUnit}>m/vkg</Text>
              </Text>
            </View>
          </View>
          <View style={S.resultsGridRow}>
            <View style={S.resultsGridCard}>
              <Text style={S.resultsGridLabel}>K CONSTANT</Text>
              <Text style={S.resultsGridValue}>{ev.kConstant.toFixed(0)}</Text>
            </View>
            <View style={S.resultsGridCard}>
              <Text style={S.resultsGridLabel}>α EXPONENT</Text>
              <Text style={S.resultsGridValue}>{ev.alphaConstant.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Status banner */}
        <View style={[S.statusCard, { backgroundColor: risk.bg, borderColor: risk.border }]}>
          <View style={[S.statusCheckbox, { backgroundColor: risk.color }]}>
            <Text style={S.statusCheckIcon}>{risk.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.statusCardTitle, { color: risk.color }]}>{risk.label}</Text>
            <Text style={S.statusCardDesc}>{risk.text}</Text>
          </View>
        </View>

        {/* Math Breakdown Box */}
        <View style={S.formulaCard}>
          <Text style={S.formulaTitle}>FORMULA BREAKDOWN</Text>
          <Text style={S.formulaLine}>
            CPD = {ev.chargePerHole} × {ev.holesDelay} = <Text style={S.formulaAccent}>{ev.cpd} kg</Text>
          </Text>
          <Text style={S.formulaLine}>
            SD = {ev.distance} / √{ev.cpd} = <Text style={S.formulaAccent}>{ev.scaledDistance.toFixed(1)} m/vkg</Text>
          </Text>
          <Text style={S.formulaLine}>
            PPV = {ev.kConstant} × {ev.scaledDistance.toFixed(1)}
            <Text style={{ fontSize: 10 }}>-{ev.alphaConstant.toFixed(1)}</Text> ={" "}
            <Text style={[S.formulaSuccess, { color: risk.color }]}>{ev.ppv.toFixed(1)} mm/s</Text>
          </Text>
        </View>

        {/* Actions */}
        <View style={S.resultsActionRow}>
          <TouchableOpacity style={S.resultsPdfBtn} onPress={() => exportEventPDF(ev)}>
            <Text style={S.resultsPdfBtnTxt}>📄 Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.resultsResetBtn} onPress={() => setActiveScreen("input")}>
            <Text style={S.resultsResetBtnTxt}>🔁 New Blast</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={S.resultsTrendBtn} onPress={() => setActiveScreen("trend")}>
          <Text style={S.resultsTrendBtnTxt}>📈 View PPV Trend for this Location</Text>
        </TouchableOpacity>

        <Text style={S.disclaimerTxt}>
          Disclaimer: Ground wave propagation yields variations based on site geophysics; calculations are indicative predictive metrics only.
        </Text>
      </ScrollView>
    );
  };

  const renderTrendsScreen = () => {
    const trendsData = getFilteredTrendsData();
    const dataPoints = trendsData.map((ev) => ev.ppv);

    let averagePpv = 0;
    let maxPpv = 0;
    const count = dataPoints.length;

    if (count > 0) {
      const sum = dataPoints.reduce((a, b) => a + b, 0);
      averagePpv = parseFloat((sum / count).toFixed(1));
      maxPpv = Math.max(...dataPoints);
    }

    // SVG Drawing helpers
    const svgWidth = Dimensions.get("window").width - 56;
    const svgHeight = 180;
    const padding = 24;

    const renderLineChart = () => {
      if (count < 2) {
        return (
          <View style={S.emptyChartBox}>
            <Text style={S.emptyChartTxt}>Insufficient data to render line path. Run more calculations.</Text>
          </View>
        );
      }

      const yMax = Math.max(10, maxPpv) * 1.25;

      // Map points to SVG coordinates
      const points = trendsData.map((ev, index) => {
        const x = padding + (index * (svgWidth - 2 * padding)) / (count - 1);
        const y = svgHeight - padding - (ev.ppv * (svgHeight - 2 * padding)) / yMax;
        return { x, y, val: ev.ppv, date: ev.date.split("/").slice(0, 2).join("/") };
      });

      // Construct line path
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }

      // Safe threshold lines
      const yLimit19 = svgHeight - padding - (19.0 * (svgHeight - 2 * padding)) / yMax;
      const yLimit50 = svgHeight - padding - (50.0 * (svgHeight - 2 * padding)) / yMax;

      return (
        <Svg width={svgWidth} height={svgHeight}>
          {/* Danger zone fills */}
          {yLimit19 > 0 && (
            <Rect
              x={padding}
              y={yLimit50 > 0 ? yLimit50 : padding}
              width={svgWidth - 2 * padding}
              height={Math.max(0, yLimit19 - (yLimit50 > 0 ? yLimit50 : padding))}
              fill="rgba(255, 140, 0, 0.03)"
            />
          )}
          {yLimit50 > 0 && (
            <Rect
              x={padding}
              y={padding}
              width={svgWidth - 2 * padding}
              height={Math.max(0, yLimit50 - padding)}
              fill="rgba(255, 68, 102, 0.03)"
            />
          )}

          {/* Guidelines */}
          {yLimit19 > 0 && yLimit19 < svgHeight - padding && (
            <Line
              x1={padding}
              y1={yLimit19}
              x2={svgWidth - padding}
              y2={yLimit19}
              stroke={Colors.moderate}
              strokeDasharray="4, 4"
              strokeWidth={1}
            />
          )}
          {yLimit50 > 0 && yLimit50 < svgHeight - padding && (
            <Line
              x1={padding}
              y1={yLimit50}
              x2={svgWidth - padding}
              y2={yLimit50}
              stroke={Colors.high}
              strokeDasharray="4, 4"
              strokeWidth={1}
            />
          )}

          {/* Line Path */}
          <Path d={d} fill="none" stroke={Colors.primary} strokeWidth={2.5} />

          {/* Dots & Labels */}
          {points.map((pt, i) => (
            <React.Fragment key={i}>
              <Circle cx={pt.x} cy={pt.y} r={4} fill={pt.val >= 50.0 ? Colors.high : pt.val >= 19.0 ? Colors.moderate : Colors.safe} />
              {/* Point Value label */}
              {count < 8 && (
                <SvgText
                  x={pt.x}
                  y={pt.y - 8}
                  fill="#FFFFFF"
                  fontSize={8}
                  fontFamily={FontFamily.medium}
                  textAnchor="middle"
                >
                  {pt.val.toFixed(1)}
                </SvgText>
              )}
              {/* X Axis Date label */}
              {(i === 0 || i === count - 1 || (count < 8 && i % 2 === 0)) && (
                <SvgText
                  x={pt.x}
                  y={svgHeight - 6}
                  fill={Colors.textMuted}
                  fontSize={8}
                  textAnchor="middle"
                >
                  {pt.date}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      );
    };

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        {/* Filter chips */}
        <View style={S.filterChipsContainer}>
          {(["7D", "30D", "All"] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[S.filterChip, trendFilter === filter && S.filterChipActive]}
              onPress={() => setTrendFilter(filter)}
            >
              <Text style={[S.filterChipTxt, trendFilter === filter && S.filterChipTxtActive]}>
                {filter === "7D" ? "Last 7 Days" : filter === "30D" ? "Last 30 Days" : "All Records"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.chartArea}>
          <Text style={S.chartTitle}>Peak Particle Velocity Wave (PPV)</Text>
          <View style={S.chartWrap}>{renderLineChart()}</View>

          <View style={S.legendRow}>
            <View style={S.legendItem}>
              <View style={[S.legendDot, { backgroundColor: Colors.safe }]} />
              <Text style={S.legendLbl}>Safe Tier (&lt; 19 mm/s)</Text>
            </View>
            <View style={S.legendItem}>
              <View style={[S.legendDot, { backgroundColor: Colors.moderate }]} />
              <Text style={S.legendLbl}>Hazard Limit (&ge; 19 mm/s)</Text>
            </View>
            <View style={S.legendItem}>
              <View style={[S.legendDot, { backgroundColor: Colors.high }]} />
              <Text style={S.legendLbl}>Structural Damage Limit (&ge; 50 mm/s)</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={S.statsBoxRow}>
          <View style={S.statsBox}>
            <Text style={S.statsBoxVal}>{count}</Text>
            <Text style={S.statsBoxLbl}>TOTAL READINGS</Text>
          </View>
          <View style={S.statsBox}>
            <Text style={S.statsBoxVal}>{averagePpv}</Text>
            <Text style={S.statsBoxLbl}>AVERAGE PPV</Text>
          </View>
          <View style={S.statsBox}>
            <Text style={S.statsBoxVal}>{maxPpv}</Text>
            <Text style={S.statsBoxLbl}>PEAK VIBRATION</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderHistoryScreen = () => {
    const filteredHistory = getFilteredHistory();

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        {/* Search Bar */}
        <View style={S.searchBar}>
          <Text style={S.searchIcon}>🔍</Text>
          <TextInput
            style={S.searchInp}
            placeholder="Search by location, date or explosive..."
            placeholderTextColor={Colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={S.searchClearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History Group List */}
        {filteredHistory.map((item) => {
          const risk = getRiskDetails(item.ppv);
          return (
            <TouchableOpacity
              key={item.id}
              style={S.historyItem}
              onPress={() => {
                setSelectedEvent(item);
                setActiveScreen("results");
              }}
            >
              <View style={[S.historyRiskDot, { backgroundColor: risk.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={S.historyLocation}>{item.blastLocation.split("(")[0].trim()}</Text>
                <Text style={S.historyMeta}>
                  {item.date} {item.time} · {item.explosiveType}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[S.historyPpvVal, { color: risk.color }]}>{item.ppv.toFixed(1)}</Text>
                <Text style={S.historyPpvLbl}>mm/s</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredHistory.length === 0 && (
          <View style={S.emptyStateCard}>
            <Text style={S.emptyStateTxt}>No history matches your search query.</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderProfileScreen = () => {
    const userInitials = user?.displayName
      ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
      : (user?.email ? user.email.slice(0, 2).toUpperCase() : "BE");

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        <View style={S.profileHeroCard}>
          <View style={S.profileAvatarLarge}>
            <Text style={S.profileAvatarLargeTxt}>{userInitials}</Text>
          </View>
          <Text style={S.profileNameText}>
            {user?.displayName ||
              user?.email?.split("@")[0] ||
              "Blast Engineer"}
          </Text>
          <View style={S.profileRoleBadge}>
            <Text style={S.profileRoleBadgeTxt}>⚙️ BLASTING ENGINEER</Text>
          </View>
          <Text style={S.profileSiteTxt}>{siteLocation}</Text>
          <Text style={S.profileEmailTxt}>{user?.email}</Text>
        </View>

        <View style={S.profilePrefSection}>
          <Text style={S.profilePrefTitle}>Calibration Constants</Text>
          
          <View style={S.profileCard}>
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>MINE SITE LOCATION NAME</Text>
              <TextInput
                style={S.textInput}
                value={siteLocation}
                onChangeText={setSiteLocation}
              />
            </View>
            <View style={S.formRow}>
              <View style={[S.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={S.inputLabel}>DEFAULT K COEFFICIENT</Text>
                <TextInput
                  style={S.textInput}
                  value={defaultK}
                  onChangeText={setDefaultK}
                  keyboardType="numeric"
                />
              </View>
              <View style={[S.inputGroup, { flex: 1 }]}>
                <Text style={S.inputLabel}>DEFAULT α ATTENUATION</Text>
                <TextInput
                  style={S.textInput}
                  value={defaultAlpha}
                  onChangeText={setDefaultAlpha}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity style={S.profileSaveBtn} onPress={saveUserProfile}>
              <Text style={S.profileSaveBtnTxt}>Save Calibration constants</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={S.profilePrefSection}>
          <Text style={S.profilePrefTitle}>Application Preferences</Text>
          
          <View style={S.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.prefLabel}>Vibration Level Alerts</Text>
              <Text style={S.prefSubLabel}>Trigger warning logs for PPV violations</Text>
            </View>
            <Switch
              value={pushAlerts}
              onValueChange={setPushAlerts}
              trackColor={{ false: "#1E2A3A", true: Colors.safe }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={S.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.prefLabel}>High Contrast UI Mode</Text>
              <Text style={S.prefSubLabel}>Enhanced visual readability for outdoors</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#1E2A3A", true: Colors.safe }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
          <Text style={S.logoutBtnTxt}>Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderNotificationsScreen = () => {
    // Generate notification list dynamically from history violations
    const violationsList = blastEvents.filter((ev) => ev.ppv >= 19.0);

    return (
      <ScrollView style={S.scrollContainer} contentContainerStyle={S.scrollContent}>
        {violationsList.map((item) => (
          <View key={item.id} style={S.notifCard}>
            <View style={[S.notifIconWrap, item.ppv >= 50.0 ? S.notifIconCritical : S.notifIconWarning]}>
              <Text style={{ fontSize: 16 }}>{item.ppv >= 50.0 ? "🚨" : "⚠️"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.notifTitle}>
                {item.ppv >= 50.0 ? "Critical Compliance Failure" : "Vibration Hazard Alert"}
              </Text>
              <Text style={S.notifBody}>
                Seismograph limits exceeded at {item.blastLocation.split("(")[0].trim()}. Predicted PPV is {item.ppv.toFixed(1)} mm/s, exceeding safety thresholds.
              </Text>
              <Text style={S.notifTime}>{item.date} {item.time}</Text>
            </View>
          </View>
        ))}

        <View style={S.notifCard}>
          <View style={[S.notifIconWrap, S.notifIconSuccess]}>
            <Text style={{ fontSize: 16 }}>📡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.notifTitle}>Firestore Sync Complete</Text>
            <Text style={S.notifBody}>
              {blastEvents.length} blast record{blastEvents.length !== 1 ? "s" : ""} loaded
              from Firebase Cloud Firestore for {user?.email ?? "current user"}.
            </Text>
            <Text style={S.notifTime}>
              {lastSyncTime
                ? `Synced at ${lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not yet synced"}
            </Text>
          </View>
        </View>

        {violationsList.length === 0 && (
          <View style={S.notifCard}>
            <View style={[S.notifIconWrap, S.notifIconSuccess]}>
              <Text style={{ fontSize: 16 }}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.notifTitle}>All Clear</Text>
              <Text style={S.notifBody}>
                No structural safety threshold exceedances recorded at the mine site.
              </Text>
              <Text style={S.notifTime}>Today</Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const getScreenTitle = () => {
    switch (activeScreen) {
      case "dash":
        return "BLASTGUARD";
      case "input":
        return "NEW BLAST";
      case "results":
        return "COMPLIANCE REPORT";
      case "trend":
        return "VIBRATION TRENDS";
      case "history":
        return "BLAST HISTORY";
      case "profile":
        return "MY PROFILE";
      case "notif":
        return "ALERTS";
      default:
        return "BLASTGUARD";
    }
  };

  const getHeaderBackScreen = () => {
    if (activeScreen === "results") return "input";
    if (activeScreen === "notif") return "dash";
    return undefined;
  };

  return (
    <SafeAreaView style={S.safeArea}>
      {renderHeader(getScreenTitle(), getHeaderBackScreen())}

      {/* Main active sub-page routing display */}
      <View style={{ flex: 1 }}>
        {activeScreen === "dash" && renderDashboardScreen()}
        {activeScreen === "input" && renderNewBlastScreen()}
        {activeScreen === "results" && renderResultsScreen()}
        {activeScreen === "trend" && renderTrendsScreen()}
        {activeScreen === "history" && renderHistoryScreen()}
        {activeScreen === "profile" && renderProfileScreen()}
        {activeScreen === "notif" && renderNotificationsScreen()}
      </View>

      {renderSidebar()}
      {renderBottomNav()}
    </SafeAreaView>
  );
}

// Sub-components
function SidebarMenuItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[S.sidebarMenuItem, active && S.sidebarMenuItemActive]}
      onPress={onPress}
    >
      <View style={[S.sidebarMenuIconWrap, active && S.sidebarMenuIconWrapActive]}>
        <Text style={S.sidebarMenuIconTxt}>{icon}</Text>
      </View>
      <Text style={[S.sidebarMenuItemTxt, active && S.sidebarMenuItemTxtActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BottomNavItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const renderIcon = () => {
    // Basic drawing using SVG/Views for crisp bottom tabs
    let fill = active ? Colors.primary : Colors.textMuted;
    if (icon === "house") {
      return (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M3 10L11 3L19 10V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H5C4.46957 20 3.96086 19.7893 3.58579 19.4142C3.21071 19.0391 3 18.5304 3 18V10Z"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else if (icon === "flame") {
      return (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M11 2C11 2 17 6.5 17 12C17 13.5913 16.3679 15.1174 15.2426 16.2426C14.1174 17.3679 12.5913 18 11 18C9.4087 18 7.88258 17.3679 6.75736 16.2426C5.63214 15.1174 5 13.5913 5 12C5 6.5 11 2 11 2Z"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else if (icon === "chart") {
      return (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M3 19H19"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M3 14L8 9L13 12L19 5"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else if (icon === "history") {
      return (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M12 8V12L15 14"
            stroke={fill}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3.05 11C3.05 6.61 6.61 3.05 11 3.05C15.39 3.05 18.95 6.61 18.95 11C18.95 15.39 15.39 18.95 11 18.95C6.61 18.95 3.05 15.39 3.05 11Z"
            stroke={fill}
            strokeWidth="1.8"
          />
        </Svg>
      );
    } else {
      return (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Circle cx="11" cy="7" r="4" stroke={fill} strokeWidth="1.8" />
          <Path
            d="M4 18C4 14.6863 6.68629 12 10 12H12C15.3137 12 18 14.6863 18 18"
            stroke={fill}
            strokeWidth="1.8"
          />
        </Svg>
      );
    }
  };

  return (
    <TouchableOpacity style={S.bnavItem} onPress={onPress}>
      <View style={S.bnavIcon}>{renderIcon()}</View>
      <Text style={[S.bnavLabel, active && { color: Colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 16,
  },
  
  // Header Component
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.cardDeep,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerBackIcon: {
    color: Colors.text,
    fontSize: 16,
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: "space-between",
  },
  hamLine: {
    height: 2,
    backgroundColor: Colors.text,
    borderRadius: 1,
    width: 24,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  headerActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardMid,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  headerNotificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    backgroundColor: Colors.high,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: Colors.cardMid,
  },

  // Sidebar Menu Drawer
  sidebarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sidebarContainer: {
    width: 280,
    height: "100%",
    backgroundColor: Colors.cardDeep,
    paddingTop: 50,
    paddingBottom: 20,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  sidebarHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sidebarBrandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  sidebarBrandSub: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sidebarUserCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarAvatarTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.secondary,
  },
  sidebarUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sidebarUserName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  sidebarUserRole: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  sidebarMenu: {
    paddingVertical: 12,
    flex: 1,
  },
  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sidebarMenuItemActive: {
    backgroundColor: "rgba(220, 161, 49, 0.08)",
  },
  sidebarMenuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardDeep,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sidebarMenuIconWrapActive: {
    backgroundColor: "rgba(220, 161, 49, 0.15)",
    borderColor: Colors.primary,
  },
  sidebarMenuIconTxt: {
    fontSize: 14,
  },
  sidebarMenuItemTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  sidebarMenuItemTxtActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  sidebarFooter: {
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  sidebarVersion: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.muted,
  },
  sidebarLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  sidebarLogoutIcon: {
    fontSize: 14,
    color: Colors.high,
  },
  sidebarLogoutTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.high,
    marginLeft: 8,
  },

  // Bottom Navigation Bar
  bottomNav: {
    height: 72,
    backgroundColor: Colors.cardDeep,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 6,
  },
  bnavItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  bnavIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bnavLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  // Dashboard Sub-screen
  dashGreeting: {
    marginTop: 16,
    marginBottom: 14,
  },
  dashGreetingTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.text,
  },
  dashGreetingSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusPillContainer: {
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusPillSafe: {
    backgroundColor: "rgba(0, 212, 138, 0.08)",
    borderColor: "rgba(0, 212, 138, 0.2)",
  },
  statusPillViol: {
    backgroundColor: "rgba(255, 68, 102, 0.08)",
    borderColor: "rgba(255, 68, 102, 0.2)",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "currentColor",
    marginRight: 8,
  },
  statusPillTxt: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricGrid: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    color: Colors.text,
  },
  metricUnit: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: FontFamily.regular,
  },
  metricChange: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  seeAllTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.primary,
  },
  quickActionsGrid: {
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "flex-start",
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.text,
  },
  quickActionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  blastCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  blastCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  blastCardLocation: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  blastCardStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  blastStatBox: {
    marginRight: 20,
  },
  blastStatVal: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.text,
  },
  blastStatLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  blastCardTime: {
    marginLeft: "auto",
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  emptyStateCard: {
    padding: 20,
    backgroundColor: Colors.cardDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  emptyStateTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // Input Form Screen
  inputCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  inputCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gpsBtn: {
    backgroundColor: "rgba(220, 161, 49, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(220, 161, 49, 0.25)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  gpsBtnTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
  },
  textInput: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  explosiveSelectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  explosiveOption: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary,
  },
  explosiveOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  explosiveOptionTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  explosiveOptionTxtActive: {
    color: Colors.secondary,
    fontFamily: FontFamily.semiBold,
  },
  cpdPreviewBox: {
    backgroundColor: "rgba(220, 161, 49, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(220, 161, 49, 0.15)",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cpdFormulaTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textMuted,
  },
  cpdHelpTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cpdPreviewVal: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.primary,
  },
  cpdPreviewUnit: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: FontFamily.regular,
  },
  constantsWarningBox: {
    marginTop: 10,
    backgroundColor: "rgba(220, 161, 49, 0.04)",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  constantsWarningTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  calcBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    ...Shadow.button,
  },
  calcBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Results Details Screen
  resultsHeroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(220, 161, 49, 0.12)",
    paddingVertical: 24,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  resultsHeroSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultsHeroVal: {
    fontFamily: FontFamily.bold,
    fontSize: 54,
  },
  resultsHeroUnit: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  resultsHeroMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  resultsGrid: {
    marginBottom: 12,
  },
  resultsGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultsGridCard: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsGridLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultsGridValue: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.text,
  },
  resultsGridUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: FontFamily.regular,
  },
  statusCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  statusCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusCheckIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statusCardDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  formulaCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  formulaTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  formulaLine: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  formulaAccent: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  formulaSuccess: {
    fontFamily: FontFamily.bold,
  },
  resultsActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultsPdfBtn: {
    flex: 1.1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
    justifyContent: "center",
  },
  resultsPdfBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
    fontSize: 13,
  },
  resultsResetBtn: {
    flex: 0.9,
    backgroundColor: Colors.cardDeep,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
  },
  resultsResetBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.text,
    fontSize: 13,
  },
  resultsTrendBtn: {
    backgroundColor: Colors.cardDeep,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  resultsTrendBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.text,
    fontSize: 12,
  },
  disclaimerTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 9.5,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 14,
  },

  // PPV Trends Screen
  filterChipsContainer: {
    flexDirection: "row",
    marginVertical: 12,
    gap: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardDeep,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  filterChipTxtActive: {
    color: Colors.secondary,
    fontFamily: FontFamily.semiBold,
  },
  chartArea: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  chartTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.text,
    marginBottom: 10,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 180,
  },
  emptyChartBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyChartTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLbl: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.textMuted,
  },
  statsBoxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statsBox: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
    alignItems: "center",
  },
  statsBoxVal: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.text,
  },
  statsBoxLbl: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Blast History Screen
  searchBar: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInp: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    padding: 0,
  },
  searchClearIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 6,
  },
  historyItem: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  historyRiskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  historyLocation: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.text,
  },
  historyMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyPpvVal: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  historyPpvLbl: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: Colors.textMuted,
  },

  // Profile Screen
  profileHeroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileAvatarLargeTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.secondary,
  },
  profileNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.text,
  },
  profileRoleBadge: {
    backgroundColor: "rgba(220, 161, 49, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(220, 161, 49, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  profileRoleBadgeTxt: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  profileSiteTxt: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  profileEmailTxt: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  profilePrefSection: {
    marginBottom: 16,
  },
  profilePrefTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  profileSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  profileSaveBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
    fontSize: 13,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  prefLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  prefSubLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: Colors.high,
    backgroundColor: "rgba(255, 68, 102, 0.05)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 10,
  },
  logoutBtnTxt: {
    fontFamily: FontFamily.bold,
    color: Colors.high,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Alerts Screen
  notifCard: {
    backgroundColor: Colors.cardDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifIconWarning: {
    backgroundColor: "rgba(255, 140, 0, 0.1)",
  },
  notifIconCritical: {
    backgroundColor: "rgba(255, 68, 102, 0.1)",
  },
  notifIconSuccess: {
    backgroundColor: "rgba(0, 212, 138, 0.1)",
  },
  notifTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.text,
  },
  notifBody: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
    marginTop: 4,
  },
  notifTime: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.muted,
    marginTop: 6,
  },
});