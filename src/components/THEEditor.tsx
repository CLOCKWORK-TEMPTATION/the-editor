/**
 * THEEditor - The Ultimate Screenplay Editor
 * 
 * This editor combines the best features from:
 * 1. screenplay-editor.tsx - SceneHeaderAgent, postProcessFormatting, advanced paste handling, ReDoS Protection, fetchWithRetry
 * 2. CleanIntegratedScreenplayEditor.tsx - System Classes, AdvancedAgentsPopup, Sidebar, Status Bar
 * 
 * Key Features:
 * ✅ SceneHeaderAgent for complex Arabic scene headers
 * ✅ postProcessFormatting for intelligent text correction
 * ✅ Advanced paste handling with context tracking
 * ✅ ReDoS Protection in regex patterns
 * ✅ ExportDialog integration
 * ✅ Enhanced Keyboard Shortcuts (Ctrl+1-6)
 * ✅ fetchWithRetry with exponential backoff
 * ✅ All 7 System Classes (StateManager, AutoSaveManager, AdvancedSearchEngine, etc.)
 * ✅ AdvancedAgentsPopup integration
 * ✅ Full Sidebar with statistics
 * ✅ Status Bar with live info
 * ✅ AI Writing Assistant
 * ✅ Character Rename functionality
 * ✅ Dark/Light mode
 */

"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Sun,
  Moon,
  FileText,
  Bold,
  Italic,
  Underline,
  MoveVertical,
  Type,
  Search,
  Replace,
  Save,
  FolderOpen,
  Printer,
  Settings,
  Download,
  FilePlus,
  Undo,
  Redo,
  Scissors,
  Film,
  Camera,
  Feather,
  UserSquare,
  Parentheses,
  MessageCircle,
  FastForward,
  ChevronDown,
  BookHeart,
  Hash,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Activity,
  Globe,
  Database,
  Zap,
  Share2,
  Check,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  GitBranch,
  Clock,
  Bookmark,
  Tag,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Mail,
  Phone,
  Link,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Send,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Users,
  PenTool,
  Brain,
} from "lucide-react";
import AdvancedAgentsPopup from "./AdvancedAgentsPopup";
import ExportDialog from "./ExportDialog";
import MainHeader from "./MainHeader";
import { applyRegexReplacementToTextNodes } from "../modules/domTextReplacement";
import { AIWritingAssistant } from "../classes/AIWritingAssistant";
import { StateManager } from "../classes/systems/StateManager";
import { AutoSaveManager } from "../classes/systems/AutoSaveManager";
import { AdvancedSearchEngine } from "../classes/systems/AdvancedSearchEngine";
import { CollaborationSystem } from "../classes/systems/CollaborationSystem";
import { ProjectManager } from "../classes/systems/ProjectManager";
import { VisualPlanningSystem } from "../classes/systems/VisualPlanningSystem";
import type {
  Script,
  Scene,
  Character,
  DialogueLine,
  SceneActionLine,
  LineContext,
  ClassificationScore,
  ClassificationResult,
  CandidateType,
  BatchClassificationResult,
  ReviewableLineUI,
  ClassifiedLine,
  ViterbiState,
} from "../types/types";
import { ALL_STATES } from "../types/types";

// ==================== CLASS IMPORTS ====================
// Note: ScreenplayClassifier, DocumentMemory, EmissionCalculator, SmartImportSystem,
// and ClassifierReviewer are defined in this file below (after the component).
// They are exported for use by other modules.

// ==================== HELPER UTILITIES ====================

/**
 * @function cssObjectToString
 * @description تحويل كائن CSS styles إلى string
 */
export const cssObjectToString = (styles: React.CSSProperties): string => {
  return Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}: ${value}`;
    })
    .join("; ");
};

/**
 * @function getFormatStyles
 * @description دالة مساعدة عامة للحصول على أنماط التنسيق - مصدرة للاستخدام في الكلاسات
 */
export const getFormatStyles = (
  formatType: string,
  selectedSize: string = "12pt",
  selectedFont: string = "AzarMehrMonospaced-San"
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    fontFamily: selectedFont,
    fontSize: selectedSize,
    direction: "rtl",
    lineHeight: "14pt",
    marginBottom: "2pt",
    minHeight: "14pt",
  };

  const formatStyles: { [key: string]: React.CSSProperties } = {
    basmala: { textAlign: "left", margin: "0 auto" },
    "scene-header-top-line": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      width: "100%",
    },
    "scene-header-3": {
      textAlign: "center",
    },
    action: { textAlign: "right", width: "100%", margin: "0" },
    character: {
      textAlign: "center",
      margin: "0 auto",
    },
    parenthetical: {
      textAlign: "center",
      margin: "0 auto",
    },
    dialogue: {
      width: "2.5in",
      textAlign: "center",
      margin: "0 auto",
    },
    transition: {
      textAlign: "center",
      margin: "0 auto",
    },
    "scene-header-1": {
      flex: "0 0 auto",
    },
    "scene-header-2": {
      flex: "0 0 auto",
    },
  };

  const finalStyles = { ...formatStyles[formatType], ...baseStyles };
  return finalStyles;
};

/**
 * @function postProcessFormatting
 * @description دالة مساعدة عامة لمعالجة ما بعد اللصق - مصدرة للاستخدام في الدوال الأخرى
 */
// إزالة التصريح المكرر لـ postProcessFormatting لتجنب الخطأ "Cannot redeclare block-scoped variable 'postProcessFormatting'"
// تم حذف التصريح المكرر

// ==================== FETCH WITH RETRY ====================

// قائمة المصادر المسموح بها للطلبات
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  '/api/', // الروابط النسبية فقط
];

// التحقق من صحة الرابط
const isValidUrl = (url: string): boolean => {
  // السماح بالروابط النسبية التي تبدأ بـ /
  if (url.startsWith('/')) return true;
  
  try {
    const urlObj = new URL(url);
    return ALLOWED_ORIGINS.some(origin => 
      urlObj.origin === origin || url.startsWith(origin)
    );
  } catch {
    return false;
  }
};

// تنظيف HTML لمنع XSS
const sanitizeHtml = (html: string): string => {
  const temp = document.createElement('div');
  temp.textContent = html; // هذا يهرب من HTML
  return temp.innerHTML;
};

// تنظيف مدخلات السجلات لمنع Log Injection
const sanitizeLogInput = (input: string): string => {
  return input
    .replace(/[\r\n]/g, ' ') // إزالة أسطر جديدة
    .replace(/[^\x20-\x7E\u0600-\u06FF]/g, '') // الاحتفاظ فقط بالرموز المطبوعة والعربية
    .substring(0, 200); // تحديد الطول
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> => {
  // التحقق من صحة الرابط قبل إجراء الطلب
  if (!isValidUrl(url)) {
    throw new Error('Invalid or unauthorized URL');
  }

  try {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if (response.status >= 400 && response.status < 500) {
      throw new Error(`Client error: ${response.status}`);
    }

    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};

// ==================== MAIN COMPONENT ====================

export default function THEEditor() {
  const [htmlContent, setHtmlContent] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentFormat, setCurrentFormat] = useState("action");
  const [selectedFont, setSelectedFont] = useState("AzarMehrMonospaced-San");
  const [selectedSize, setSelectedSize] = useState("12pt");
  const [documentStats, setDocumentStats] = useState({
    characters: 0,
    words: 0,
    pages: 1,
    scenes: 0,
  });

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCharacterRename, setShowCharacterRename] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [oldCharacterName, setOldCharacterName] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");

  const [showReviewerDialog, setShowReviewerDialog] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState("");

  const [showRulers, setShowRulers] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAdvancedAgents, setShowAdvancedAgents] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const stateManager = useRef(new StateManager());
  const autoSaveManager = useRef(new AutoSaveManager());
  const searchEngine = useRef(new AdvancedSearchEngine());
  const collaborationSystem = useRef(new CollaborationSystem());
  const aiAssistant = useRef(new AIWritingAssistant());
  const projectManager = useRef(new ProjectManager());
  const visualPlanning = useRef(new VisualPlanningSystem());
  const screenplayClassifier = useRef(new ScreenplayClassifier());

  const cssObjectToString = (styles: React.CSSProperties): string => {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        return `${cssKey}: ${value}`;
      })
      .join("; ");
  };

  // نسخة محلية من getFormatStyles (الدالة المصدرة في نهاية الملف)
  const getFormatStylesLocal = (formatType: string): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontFamily: selectedFont,
      fontSize: selectedSize,
      direction: "rtl",
      lineHeight: "14pt",
      marginBottom: "2pt",
      minHeight: "14pt",
    };

    const formatStyles: { [key: string]: React.CSSProperties } = {
      basmala: { textAlign: "left", margin: "0 auto" },
      "scene-header-top-line": {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        width: "100%",
      },
      "scene-header-3": {
        textAlign: "center",
      },
      action: { textAlign: "right", width: "100%", margin: "0" },
      character: {
        textAlign: "center",
        margin: "0 auto",
      },
      parenthetical: {
        textAlign: "center",
        margin: "0 auto",
      },
      dialogue: {
        width: "2.5in",
        textAlign: "center",
        margin: "0 auto",
      },
      transition: {
        textAlign: "center",
        margin: "0 auto",
      },
      "scene-header-1": {
        flex: "0 0 auto",
      },
      "scene-header-2": {
        flex: "0 0 auto",
      },
    };

    const finalStyles = { ...formatStyles[formatType], ...baseStyles };
    return finalStyles;
  };

  const isCurrentElementEmpty = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.startContainer.parentElement;
      return element && element.textContent === "";
    }
    return false;
  };

  const getNextFormatOnTab = (currentFormat: string, shiftKey: boolean) => {
    const mainSequence = [
      "scene-header-top-line",
      "action",
      "character",
      "transition",
    ];

    switch (currentFormat) {
      case "character":
        if (shiftKey) {
          return isCurrentElementEmpty() ? "action" : "transition";
        } else {
          return "dialogue";
        }
      case "dialogue":
        if (shiftKey) {
          return "character";
        } else {
          return "parenthetical";
        }
      case "parenthetical":
        return "dialogue";
      default:
        const currentIndex = mainSequence.indexOf(currentFormat);
        if (currentIndex !== -1) {
          if (shiftKey) {
            return mainSequence[Math.max(0, currentIndex - 1)];
          } else {
            return mainSequence[
              Math.min(mainSequence.length - 1, currentIndex + 1)
            ];
          }
        }
        return "action";
    }
  };

  const getNextFormatOnEnter = (currentFormat: string) => {
    const transitions: { [key: string]: string } = {
      "scene-header-top-line": "scene-header-3",
      "scene-header-3": "action",
      "scene-header-1": "scene-header-3",
      "scene-header-2": "scene-header-3",
      "character": "dialogue",
      "dialogue": "action",
      "parenthetical": "dialogue",
      "action": "action",
      "transition": "scene-header-top-line",
    };

    return transitions[currentFormat] || "action";
  };

  // نسخة محلية من formatText (الدالة المصدرة في نهاية الملف)
  const formatTextLocal = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  const calculateStats = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.innerText || "";
      const characters = textContent.length;
      const words = textContent.trim()
        ? textContent.trim().split(/\s+/).length
        : 0;
      const scenes = (textContent.match(/مشهد\s*\d+/gi) || []).length;

      const scrollHeight = editorRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollHeight / (29.7 * 37.8)));

      setDocumentStats({ characters, words, pages, scenes });
    }
  };

  // نسخة محلية من applyFormatToCurrentLine
  const applyFormatToCurrentLineLocal = (formatType: string, isEnterAction: boolean = false) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.startContainer.parentElement;

      if (element) {
        if (isEnterAction) {
          const currentText = element.textContent || "";
          const textNode = range.startContainer;
          let offset = range.startOffset;

          if (textNode.nodeType === Node.TEXT_NODE) {
            let totalOffset = 0;
            let currentNode = element.firstChild;
            while (currentNode && currentNode !== textNode) {
              totalOffset += currentNode.textContent?.length || 0;
              currentNode = currentNode.nextSibling;
            }
            if (currentNode === textNode) {
              totalOffset += offset;
            }
            offset = totalOffset;
          }

          const beforeText = currentText.slice(0, offset);

          element.textContent = beforeText;

          const newLine = document.createElement('div');
          newLine.className = formatType;
          newLine.textContent = ''; 
          Object.assign(newLine.style, getFormatStylesLocal(formatType));

          if (element.parentElement) {
            element.parentElement.insertBefore(newLine, element.nextSibling);
          }

          const newRange = document.createRange();
          newRange.setStart(newLine, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          setCurrentFormat(formatType);
        } else {
          element.className = formatType;
          Object.assign(element.style, getFormatStylesLocal(formatType));
          setCurrentFormat(formatType);
        }
      }
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const element = range.startContainer.parentElement;
        if (element) {
          setCurrentFormat(element.className || "action");
        }
      }

      calculateStats();
    }
  };

  // نسخة محلية كاملة من postProcessFormatting
  const postProcessFormattingLocal = (htmlResult: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlResult;
    const elements = Array.from(tempDiv.children);

    for (let i = 0; i < elements.length; i++) {
      const currentElement = elements[i] as HTMLElement;
      const nextElement = elements[i + 1] as HTMLElement | undefined;

      if (currentElement.className === "action" || currentElement.className === "character") {
        const textContent = currentElement.textContent || "";
        const bulletCharacterPattern = ScreenplayClassifier.BULLET_CHARACTER_RE;
        const match = textContent.match(bulletCharacterPattern);

        if (match) {
          const characterName = (match[1] || "").trim();
          const dialogueText = (match[2] || "").trim();

          if (!characterName) {
            continue;
          }

          currentElement.className = "character";
          currentElement.textContent = characterName + ":";
          Object.assign(currentElement.style, getFormatStylesLocal("character"));

          const dialogueElement = document.createElement("div");
          dialogueElement.className = "dialogue";
          dialogueElement.textContent = dialogueText;
          Object.assign(dialogueElement.style, getFormatStylesLocal("dialogue"));

          if (nextElement) {
            tempDiv.insertBefore(dialogueElement, nextElement);
          } else {
            tempDiv.appendChild(dialogueElement);
          }
        }
      }
    }

    return tempDiv.innerHTML;
  };

  // نسخة محلية كاملة من handlePaste
  const handlePasteLocal = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    try {
      const clipboardData = e.clipboardData;
      const pastedText = clipboardData.getData("text/plain");

      if (editorRef.current) {
      const classifiedElements = await ScreenplayClassifier.classifyBatchWithAIReview(
        pastedText,
        true,
        undefined,
        20
      );

      let htmlResult = "";

      for (const element of classifiedElements) {
        const { text, type } = element;
        const styles = getFormatStylesLocal(type);
        const styleString = cssObjectToString(styles);

        if (type === "scene-header-top-line") {
          const sceneHeaderParts = ScreenplayClassifier.parseSceneHeaderFromLine(text);
          
          if (sceneHeaderParts) {
            const container = document.createElement("div");
            container.className = "scene-header-top-line";
            Object.assign(container.style, styles);

            const part1 = document.createElement("span");
            part1.className = "scene-header-1";
            part1.textContent = sceneHeaderParts.sceneNum;
            Object.assign(part1.style, getFormatStylesLocal("scene-header-1"));
            container.appendChild(part1);

            if (sceneHeaderParts.timeLocation) {
              const part2 = document.createElement("span");
              part2.className = "scene-header-2";
              part2.textContent = sceneHeaderParts.timeLocation;
              Object.assign(part2.style, getFormatStylesLocal("scene-header-2"));
              container.appendChild(part2);
            }

            htmlResult += container.outerHTML;
          } else {
            htmlResult += `<div class="${type}" style="${styleString}">${text}</div>`;
          }
        } else {
          htmlResult += `<div class="${type}" style="${styleString}">${text}</div>`;
        }
      }

      const correctedHtmlResult = postProcessFormattingLocal(htmlResult);

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = correctedHtmlResult;

      const elements = Array.from(tempDiv.querySelectorAll<HTMLElement>("div, span"));
      elements.forEach((element) => {
        const className = element.className;
        if (className) {
          Object.assign(element.style, getFormatStylesLocal(className));
        }
      });

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(fragment);
        range.collapse(false);
      }

      updateContent();
    }
  } catch (error) {
    console.error('فشلت عملية اللصق:', error);
    alert('فشلت عملية اللصق. يرجى المحاولة مرة أخرى.');
  }
  };

  // handleKeyDown wrapper
  const handleKeyDown = (e: React.KeyboardEvent) => {
    createHandleKeyDown(
      currentFormat,
      getNextFormatOnTab,
      getNextFormatOnEnter,
      applyFormatToCurrentLineLocal,
      formatTextLocal,
      setShowSearchDialog,
      setShowReplaceDialog,
      updateContent
    )(e);
  };

  // نسخ محلية من الـ handlers (الدوال المصدرة في نهاية الملف)
  const handleSearch = () => {
    const handler = createHandleSearch(
      searchTerm,
      editorRef,
      searchEngine,
      setShowSearchDialog
    );
    handler();
  };

  const handleReplace = () => {
    const handler = createHandleReplace(
      searchTerm,
      replaceTerm,
      editorRef,
      searchEngine,
      updateContent,
      setShowReplaceDialog,
      setSearchTerm,
      setReplaceTerm
    );
    handler();
  };

  const handleCharacterRename = () => {
    const handler = createHandleCharacterRename(
      oldCharacterName,
      newCharacterName,
      editorRef,
      updateContent,
      setShowCharacterRename,
      setOldCharacterName,
      setNewCharacterName
    );
    handler();
  };

  const handleAIReview = () => {
    const handler = createHandleAIReview(
      editorRef,
      setIsReviewing,
      setReviewResult
    );
    handler();
  };

  useEffect(() => {
    if (editorRef.current) {
      const elements = editorRef.current.querySelectorAll<HTMLElement>(
        "div, span"
      );
      elements.forEach((element) => {
        const className = element.className;
        Object.assign(element.style, getFormatStylesLocal(className));
      });
      calculateStats();
    }
  }, [selectedFont, selectedSize, htmlContent]);

  useEffect(() => {
    calculateStats();
  }, [htmlContent]);

  useEffect(() => {
    if (editorRef.current && !htmlContent) {
      const initialContent = `
        <div class="basmala">بسم الله الرحمن الرحيم</div>
        <div class="scene-header-top-line">
          <div>المؤلف: اسم المؤلف</div>
          <div>التاريخ: ${new Date().toLocaleDateString("ar")}</div>
        </div>
        <div class="scene-header-3">مشهد 1</div>
        <div class="action">[وصف المشهد والأفعال هنا]</div>
        <div class="character">الاسم</div>
        <div class="dialogue">[الحوار هنا]</div>
      `;

      editorRef.current.innerHTML = sanitizeHtml(initialContent);

      // Apply styles to all elements after creation
      const elements = editorRef.current.querySelectorAll<HTMLElement>(
        "div, span"
      );
      elements.forEach((element) => {
        const className = element.className;
        if (className) {
          Object.assign(element.style, getFormatStylesLocal(className));
        }
      });

      updateContent();
    }

    autoSaveManager.current.setSaveCallback(async (content) => {
      console.log("Auto-saved content:", sanitizeLogInput(content));
    });
    autoSaveManager.current.startAutoSave();

    return () => {
      autoSaveManager.current.stopAutoSave();
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"}`}
      dir="rtl"
    >
      {/* Header with Glass Morphism */}
      <header className="border-b border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-900/70 text-white sticky top-0 z-10 backdrop-blur-xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
                <Film className="text-blue-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-l from-white to-white/70 bg-clip-text text-transparent">
                النسخة
              </h1>
              <p className="text-xs text-white/50 font-medium tracking-wide">أڨان تيتر</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="group relative p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:to-blue-500/10 rounded-xl transition-all duration-300"></div>
              {isDarkMode ? <Sun size={18} className="relative" /> : <Moon size={18} className="relative" />}
            </button>

            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                ملف
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <FilePlus size={14} className="text-blue-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">جديد</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                        <FolderOpen size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">فتح</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <Save size={14} className="text-violet-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">حفظ</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                        <Download size={14} className="text-amber-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">تصدير</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setShowEditMenu(!showEditMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                تحرير
                <ChevronDown size={14} className={`transition-transform duration-200 ${showEditMenu ? 'rotate-180' : ''}`} />
              </button>

              {showEditMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-slate-500/20 group-hover:bg-slate-500/30 transition-colors">
                        <Undo size={14} className="text-slate-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">تراجع</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-slate-500/20 group-hover:bg-slate-500/30 transition-colors">
                        <Redo size={14} className="text-slate-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">إعادة</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
                        <Scissors size={14} className="text-rose-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">قص</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <Copy size={14} className="text-cyan-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">نسخ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Format Menu */}
            <div className="relative">
              <button
                onClick={() => setShowFormatMenu(!showFormatMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                تنسيق
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFormatMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFormatMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("scene-header-top-line");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      عنوان المشهد العلوي
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("scene-header-3");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      عنوان المشهد
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("action");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      وصف الأفعال
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("character");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الشخصية
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("dialogue");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الحوار
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLineLocal("transition");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الانتقال
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                أدوات
                <ChevronDown size={14} className={`transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowSearchDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <Search size={14} className="text-blue-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">بحث</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReplaceDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <Replace size={14} className="text-violet-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">استبدال</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCharacterRename(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                        <UserSquare size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">إعادة تسمية</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewerDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                        <Sparkles size={14} className="text-amber-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">مراجعة AI</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAdvancedAgents(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
                        <Brain size={14} className="text-rose-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">الوكلاء المتقدمة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="group p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
              title="طباعة"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/0 to-slate-500/0 group-hover:from-slate-500/20 group-hover:to-slate-500/10 rounded-xl transition-all duration-300"></div>
              <Printer size={18} className="relative" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Editor Area with Subtle Background Effects */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-auto">
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative px-6 pb-6 pt-0">
            <div className="w-full flex justify-center">
              <div
                style={{ width: "210mm" }}
                className="h-[52px] flex items-center justify-center"
              >
                <MainHeader onSave={() => {}} onUndo={() => {}} />
              </div>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="screenplay-page focus:outline-none relative z-10"
              style={{
                boxSizing: "border-box",
                fontFamily: selectedFont,
                fontSize: selectedSize,
                direction: "rtl",
                lineHeight: "14pt",
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto",
                paddingTop: "1in",
                paddingBottom: "0.5in",
                paddingRight: "1.5in",
                paddingLeft: "1in",
                backgroundColor: "white",
                color: "black",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePasteLocal}
              onInput={updateContent}
            />
          </div>
        </div>

        {/* Sidebar - Elegant Glass Design */}
        <div className="no-print sidebar w-64 border-l border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 backdrop-blur-xl">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl transition-all duration-300"></div>
                <Film className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 rounded-xl transition-all duration-300"></div>
                <Camera className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-xl transition-all duration-300"></div>
                <Play className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-xl transition-all duration-300"></div>
                <Pause className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors relative" />
              </button>

              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 rounded-xl transition-all duration-300"></div>
                <FastForward className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-xl transition-all duration-300"></div>
                <Scissors className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 rounded-xl transition-all duration-300"></div>
                <Upload className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 rounded-xl transition-all duration-300"></div>
                <Download className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors relative" />
              </button>

              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-slate-500/0 group-hover:bg-slate-500/10 rounded-xl transition-all duration-300"></div>
                <Printer className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/10 rounded-xl transition-all duration-300"></div>
                <FileText className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center col-span-1">
                <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 rounded-xl transition-all duration-300"></div>
                <PenTool className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors relative" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog - Elegant Design */}
      {showSearchDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Search className="text-blue-400 w-5 h-5" />
                </div>
                بحث
              </h3>
              <button
                onClick={() => setShowSearchDialog(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">كلمة البحث</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل النص للبحث عنه"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSearchDialog(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSearch}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-blue-500/25"
                >
                  بحث
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdvancedAgentsPopup
        isOpen={showAdvancedAgents}
        onClose={() => setShowAdvancedAgents(false)}
        content={editorRef.current?.innerText || ""}
      />

      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          content={editorRef.current?.innerHTML || ""}
          title="سيناريو"
        />
      )}
    </div>
  );
}

/**
 * @class ScreenplayClassifier
 * @description مصنف السيناريو - يحتوي على جميع الدوال والـ patterns لتصنيف أسطر السيناريو
 */
export class ScreenplayClassifier {
  // ثوابت الأنماط
  static readonly AR_AB_LETTER = "\u0600-\u06FF";
  static readonly EASTERN_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  static readonly WESTERN_DIGITS = "0123456789";
  
  // ثوابت حساب doubtScore
  /** عتبة الفرق في النقاط بين المرشحين لاعتبار التصنيف غامض */
  private static readonly SCORE_TIE_THRESHOLD = 5;
  /** عتبة doubtScore التي عندها يُعتبر السطر يحتاج مراجعة */
  private static readonly NEEDS_REVIEW_THRESHOLD = 60;
  
  static readonly ACTION_VERB_LIST =
    "يدخل|يخرج|ينظر|يرفع|تبتسم|ترقد|تقف|يبسم|يضع|يقول|تنظر|تربت|تقوم|يشق|تشق|تضرب|يسحب|يلتفت|يقف|يجلس|تجلس|يجري|تجري|يمشي|تمشي|يركض|تركض|يصرخ|اصرخ|يبكي|تبكي|يضحك|تضحك|يغني|تغني|يرقص|ترقص|يأكل|تأكل|يشرب|تشرب|ينام|تنام|يستيقظ|تستيقظ|يكتب|تكتب|يقرأ|تقرأ|يسمع|تسمع|يشم|تشم|يلمس|تلمس|يأخذ|تأخذ|يعطي|تعطي|يفتح|تفتح|يغلق|تغلق|يبدأ|تبدأ|ينتهي|تنتهي|يذهب|تذهب|يعود|تعود|يأتي|تأتي|يموت|تموت|يحيا|تحيا|يقاتل|تقاتل|ينصر|تنتصر|يخسر|تخسر|يكتب|تكتب|يرسم|ترسم|يصمم|تخطط|تخطط|يقرر|تقرر|يفكر|تفكر|يتذكر|تذكر|يحاول|تحاول|يستطيع|تستطيع|يريد|تريد|يحتاج|تحتاج|يبحث|تبحث|يجد|تجد|يفقد|تفقد|يحمي|تحمي|يحمي|تحمي|يراقب|تراقب|يخفي|تخفي|يكشف|تكشف|يكتشف|تكتشف|يعرف|تعرف|يتعلم|تعلن|يعلم|تعلن|يوجه|وجه|يسافر|تسافر|يعود|تعود|يرحل|ترحل|يبقى|تبقى|ينتقل|تنتقل|يتغير|تتغير|ينمو|تنمو|يتطور|تتطور|يواجه|تواجه|يحل|تحل|يفشل|تفشل|ينجح|تنجح|يحقق|تحقن|يبدأ|تبدأ|ينهي|تنهي|يوقف|توقف|يستمر|تستمر|ينقطع|تنقطع|يرتبط|ترتبط|ينفصل|تنفصل|يتزوج|تتزوج|يطلق|يطلق|يولد|تولد|يكبر|تكبر|يشيخ|تشيخ|يمرض|تمرض|يشفي|تشفي|يصاب|تصيب|يتعافى|تعافي|يموت|يقتل|تقتل|يُقتل|تُقتل|يختفي|تختفي|يظهر|تظهر|يختبئ|تخبوء|يطلب|تطلب|يأمر|تأمر|يمنع|تمنع|يسمح|تسمح|يوافق|توافق|يرفض|ترفض|يعتذر|يشكر|تشكر|يحيي|تحيي|يودع|تودع|يجيب|تجيب|يسأل|تسأل|يصيح|تصيح|يهمس|تهمس|يصمت|تصمت|يتكلم|تتكلم|ينادي|تنادي|يحكي|تحكي|يروي|تروي|يقص|تقص|يضحك|تضحك|يبكي|تبكي|يتنهد|تتنهد|يئن|تئن";
  
  static readonly EXTRA_ACTION_VERBS =
    "نرى|نسمع|نلاحظ|نقترب|نبتعد|ننتقل|ترفع|ينهض|تنهض|تقتحم|يقتحم|يتبادل|يبتسم|يبدؤون|تفتح|يفتح|تدخل|يُظهر|يظهر|تظهر";
  
  static readonly ACTION_VERB_SET = new Set(
    (ScreenplayClassifier.ACTION_VERB_LIST + "|" + ScreenplayClassifier.EXTRA_ACTION_VERBS)
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean)
  );

  static isActionVerbStart(line: string): boolean {
    const firstToken = line.trim().split(/\s+/)[0] ?? "";
    const normalized = firstToken
      .replace(/[\u200E\u200F\u061C]/g, "")
      .replace(/[^\u0600-\u06FF]/g, "")
      .trim();
    if (!normalized) return false;
    if (ScreenplayClassifier.ACTION_VERB_SET.has(normalized)) return true;

    // دعم الواو/الفاء/اللام الملتصقة مثل: (وتقف/فيبتسم/ليجلس)
    const leadingParticles = ["و", "ف", "ل"];
    for (const p of leadingParticles) {
      if (normalized.startsWith(p) && normalized.length > 1) {
        const candidate = normalized.slice(1);
        if (ScreenplayClassifier.ACTION_VERB_SET.has(candidate)) return true;
      }
    }

    return false;
  }

  static readonly BASMALA_RE = /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*$/i;
  static readonly SCENE_PREFIX_RE =
    /^\s*(?:مشهد|م\.|scene)\s*([0-9٠-٩]+)\s*(?:[-–—:،]\s*)?(.*)$/i;
  static readonly INOUT_PART = "(?:داخلي|خارجي|د\\.|خ\\.)";
  static readonly TIME_PART =
    "(?:ليل|نهار|ل\\.|ن\\.|صباح|مساء|فجر|ظهر|عصر|مغرب|عشاء|الغروب|الفجر)";
  
  // Flexible regex to match complex combinations like "Day - Night / Ext"
  static readonly HEADER_PART_ANY = `(?:${ScreenplayClassifier.INOUT_PART}|${ScreenplayClassifier.TIME_PART})`;
  static readonly TL_REGEX = new RegExp(
    `(?:${ScreenplayClassifier.HEADER_PART_ANY}\\s*[-/&]\\s*)+${ScreenplayClassifier.HEADER_PART_ANY}|${ScreenplayClassifier.HEADER_PART_ANY}\\s*[-/&]\\s*${ScreenplayClassifier.HEADER_PART_ANY}`,
    "i"
  );
  
  static readonly PHOTOMONTAGE_RE = /^\s*[\(\)]*\s*(?:فوتو\s*مونتاج|Photomontage)\s*[\(\)]*\s*$/i;
  static readonly PHOTOMONTAGE_PART_RE = /^\s*[\(\)]*\s*(?:فوتو\s*مونتاج|Photomontage)\s*[\(\)]*/i;

  static readonly KNOWN_PLACES_RE = /^(مسجد|بيت|منزل|شارع|حديقة|مدرسة|جامعة|مكتب|محل|مستشفى|مطعم|فندق|سيارة|غرفة|قاعة|ممر|سطح|ساحة|مقبرة|مخبز|مكتبة|نهر|بحر|جبل|غابة|سوق|مصنع|بنك|محكمة|سجن|موقف|محطة|مطار|ميناء|كوبرى|نفق|مبنى|قصر|قصر عدلي|فندق|نادي|ملعب|ملهى|بار|كازينو|متحف|مسرح|سينما|معرض|مزرعة|مصنع|مختبر|مستودع|محل|مطعم|مقهى|موقف|مكتب|شركة|كهف|الكهف|غرفة الكهف|كهف المرايا|كوافير|صالون|حلاق)/i;

  static readonly CHARACTER_RE = new RegExp(
    "^\\s*(?:صوت\\s+)?[" +
    ScreenplayClassifier.AR_AB_LETTER +
    "][" +
    ScreenplayClassifier.AR_AB_LETTER +
    "\\s]{0,30}:?\\s*$"
  );
  static readonly TRANSITION_RE =
    /^\s*(?:قطع|قطع\s+إلى|إلى|مزج|ذوبان|خارج\s+المشهد|CUT TO:|FADE IN:|FADE OUT:)\s*$/i;
  static readonly PARENTHETICAL_SHAPE_RE = /^\s*\(.*?\)\s*$/;

  static readonly BULLET_CHARACTER_RE =
    /^[\s\u200E\u200F\u061C\uFEFF]*[•·∙⋅●○◦■□▪▫◆◇–—−‒―‣⁃*+]\s*([^:：]+?)\s*[:：]\s*(.*)\s*$/;

  Patterns: {
    sceneHeader1: RegExp;
    sceneHeader2: {
      time: RegExp;
      inOut: RegExp;
    };
    sceneHeader3: RegExp;
  };

  /** ذاكرة المستند (غير static لأنها تختلف لكل مستند) */
  private documentMemory: DocumentMemory;

  constructor() {
    const c = (regex: RegExp) => regex;
    this.Patterns = {
      sceneHeader1: c(/^\s*(?:مشهد|م\.|scene)\s*[0-9٠-٩]+\s*$/i),
      sceneHeader2: {
        time: new RegExp(ScreenplayClassifier.TIME_PART, "i"),
        inOut: new RegExp(ScreenplayClassifier.INOUT_PART, "i"),
      },
      sceneHeader3: c(ScreenplayClassifier.KNOWN_PLACES_RE),
    };
    this.documentMemory = new DocumentMemory();
  }

  /**
   * الحصول على ذاكرة المستند
   * @returns ذاكرة المستند الحالية
   */
  getDocumentMemory(): DocumentMemory {
    return this.documentMemory;
  }

  /**
   * مسح ذاكرة المستند (عند فتح مستند جديد)
   */
  resetDocumentMemory(): void {
    this.documentMemory.clear();
  }

  /**
   * دالة تصنيف موحدة تدعم كلاً من Greedy و Viterbi
   * @param lines مصفوفة السطور النصية
   * @param options خيارات التصنيف
   * @returns مصفوفة من السطور المصنفة
   */
  classify(
    lines: string[],
    options: {
      useViterbi?: boolean;
      emissionWeight?: number;
      transitionWeight?: number;
      updateMemory?: boolean;
    } = {}
  ): BatchClassificationResult[] {
    const { useViterbi = false } = options;

    if (useViterbi) {
      return this.classifyWithViterbi(lines, options);
    } else {
      const text = lines.join('\n');
      const simpleResults = ScreenplayClassifier.classifyBatch(text, false, this.documentMemory);
      return simpleResults.map(r => ({
        text: r.text,
        type: r.type,
        confidence: 'medium' as const,
        doubtScore: 30,
        needsReview: false,
        top2Candidates: null,
        fallbackApplied: undefined,
        viterbiOverride: undefined
      }));
    }
  }

  static easternToWesternDigits(s: string): string {
    const map: { [key: string]: string } = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (char) => map[char] || char);
  }

  static stripTashkeel(s: string): string {
    return s.replace(/[\u064B-\u065F\u0670]/g, "");
  }

  static normalizeSeparators(s: string): string {
    return s.replace(/[-–—]/g, "-").replace(/[،,]/g, ",").replace(/\s+/g, " ");
  }

  static normalizeLine(input: string): string {
    return ScreenplayClassifier.stripTashkeel(
      ScreenplayClassifier.normalizeSeparators(input)
    )
      .replace(/[\u200f\u200e\ufeff\t]+/g, "")
      .trim();
  }

  /**
   * تطبيع السطر للتحليل اللغوي - يحذف bullets ولكن يحتفظ بالشرطات
   * هذه الدالة تُستخدم للتحليل اللغوي فقط (مثل فحص الأفعال)
   */
  static normalizeForAnalysis(input: string): string {
    return this.normalizeLine(input)
      // إزالة bullets فقط (بدون الشرطات)
      .replace(/^[\s\u200E\u200F\u061C\ufeFF]*[•·∙⋅●○◦■□▪▫◆◇]+\s*/, "");
  }

  static textInsideParens(s: string): string {
    const match = s.match(/^\s*\((.*?)\)\s*$/);
    return match ? match[1] || "" : "";
  }

  static hasSentencePunctuation(s: string): boolean {
    return /[\.!\؟\?]/.test(s);
  }

  static wordCount(s: string): number {
    return s.trim() ? s.trim().split(/\s+/).length : 0;
  }

  static isBlank(line: string): boolean {
    return !line || line.trim() === "";
  }

  /**
   * الحصول على نوع آخر سطر غير فارغ
   * @param previousTypes مصفوفة الأنواع السابقة
   * @param currentIndex الفهرس الحالي
   * @returns النوع أو null
   */
  private static getPrevNonBlankType(
    previousTypes: (string | null)[],
    currentIndex: number
  ): string | null {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const type = previousTypes[i];
      if (type && type !== 'blank') {
        return type;
      }
    }
    return null;
  }

  /**
   * الحصول على عدة أنواع سابقة غير فارغة
   * @param previousTypes مصفوفة الأنواع السابقة
   * @param currentIndex الفهرس الحالي
   * @param count عدد الأنواع المطلوبة (افتراضي: 2)
   * @returns مصفوفة الأنواع
   */
  private static getPrevNonBlankTypes(
    previousTypes: (string | null)[],
    currentIndex: number,
    count: number = 2
  ): (string | null)[] {
    const result: (string | null)[] = [];
    
    for (let i = currentIndex - 1; i >= 0 && result.length < count; i--) {
      const type = previousTypes[i];
      if (type && type !== 'blank') {
        result.push(type);
      }
    }
    
    return result;
  }

  /**
   * فحص إذا كان السطر الحالي داخل بلوك حوار
   * @param previousTypes الأنواع السابقة
   * @param currentIndex الفهرس الحالي
   * @returns true إذا كان داخل بلوك حوار
   */
  private static isInDialogueBlock(
    previousTypes: (string | null)[],
    currentIndex: number
  ): boolean {
    const prevTypes = this.getPrevNonBlankTypes(previousTypes, currentIndex, 3);
    
    // بلوك الحوار: character أو dialogue أو parenthetical
    const dialogueBlockTypes = ['character', 'dialogue', 'parenthetical'];
    
    // إذا كان آخر سطر غير فارغ من بلوك الحوار
    if (prevTypes.length > 0 && dialogueBlockTypes.includes(prevTypes[0] || '')) {
      return true;
    }
    
    return false;
  }

  static isBasmala(line: string): boolean {
    const normalizedLine = line.trim();
    const basmalaPatterns = [
      /^بسم\s+الله\s+الرحمن\s+الرحيم$/i,
      /^[{}]*\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*[{}]*$/i,
    ];
    return basmalaPatterns.some((pattern) => pattern.test(normalizedLine));
  }

  static isSceneHeaderStart(line: string): boolean {
    return ScreenplayClassifier.SCENE_PREFIX_RE.test(line);
  }

  static parseInlineCharacterDialogue(line: string):
    | { characterName: string; dialogueText: string }
    | null {
    const trimmed = line.trim();
    const inlineMatch = trimmed.match(/^([^:：]{1,60}?)\s*[:：]\s*(.+)$/);
    if (!inlineMatch) return null;

    const characterName = (inlineMatch[1] || "").trim();
    const dialogueText = (inlineMatch[2] || "").trim();
    if (!characterName || !dialogueText) return null;

    if (!ScreenplayClassifier.isCharacterLine(`${characterName}:`)) return null;
    return { characterName, dialogueText };
  }

  static cleanupSceneHeaderRemainder(input: string): string {
    return ScreenplayClassifier.normalizeSeparators(input)
      .replace(/^[\s\-–—:،,]+/, "")
      .replace(/[\s\-–—:،,]+$/, "")
      .trim();
  }

  static parseSceneHeaderFromLine(rawLine: string):
    | { sceneNum: string; timeLocation: string | null; placeInline: string | null }
    | null {
    const cleaned = ScreenplayClassifier.normalizeLine(rawLine);
    const m = cleaned.match(ScreenplayClassifier.SCENE_PREFIX_RE);
    if (!m) return null;

    const prefixMatch = cleaned.match(/^\s*(مشهد|م\.|scene)\s*/i);
    const prefix = (prefixMatch?.[1] || "مشهد").trim();
    const num = (m[1] || "").trim();
    let sceneNum = `${prefix} ${num}`.replace(/\s+/g, " ").trim();

    let rest = (m[2] || "").trim();
    
    // Check for Photomontage in the rest of the line
    const pmMatch = rest.match(ScreenplayClassifier.PHOTOMONTAGE_PART_RE);
    if (pmMatch) {
      const pmText = pmMatch[0].trim();
      // Clean up: remove all existing parens and wrap cleanly
      const inner = pmText.replace(/^[\(\)]+|[\(\)]+$/g, "").trim();
      const formattedPm = `(${inner})`;
      
      sceneNum = `${sceneNum} ${formattedPm}`;
      rest = rest.substring(pmMatch[0].length).trim();
    }

    if (!rest) {
      return { sceneNum, timeLocation: null, placeInline: null };
    }

    const tlMatch = rest.match(ScreenplayClassifier.TL_REGEX);
    if (tlMatch) {
      const timeLocation = (tlMatch[0] || "").trim();
      const remainder = ScreenplayClassifier.cleanupSceneHeaderRemainder(
        rest.replace(tlMatch[0], " ")
      );
      return {
        sceneNum,
        timeLocation: timeLocation || null,
        placeInline: remainder || null,
      };
    }

    const inOutOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.INOUT_PART}\\s*$`, "i");
    const timeOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.TIME_PART}\\s*$`, "i");
    if (inOutOnlyRe.test(rest) || timeOnlyRe.test(rest)) {
      return { sceneNum, timeLocation: rest.trim(), placeInline: null };
    }

    const placeInline = ScreenplayClassifier.cleanupSceneHeaderRemainder(rest);
    return { sceneNum, timeLocation: null, placeInline: placeInline || null };
  }

  static extractSceneHeaderParts(
    lines: string[],
    startIndex: number
  ):
    | {
        sceneNum: string;
        timeLocation: string;
        place: string;
        consumedLines: number;
        remainingAction?: string;
      }
    | null {
    let remainingAction: string | undefined;
    const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(
      lines[startIndex] || ""
    );
    if (!parsed) return null;

    let timeLocation = parsed.timeLocation || "";

    const inOutOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.INOUT_PART}\\s*$`, "i");
    const timeOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.TIME_PART}\\s*$`, "i");

    const placeParts: string[] = [];
    if (parsed.placeInline) placeParts.push(parsed.placeInline);

    let currentSceneNum = parsed.sceneNum;
    let consumedLines = 1;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const rawNext = lines[i] || "";
      if (ScreenplayClassifier.isBlank(rawNext)) break;

      let normalizedNext = ScreenplayClassifier.normalizeLine(rawNext);
      if (!normalizedNext) break;

      // 1. Check for Photomontage at the start of the line
      const pmMatch = normalizedNext.match(ScreenplayClassifier.PHOTOMONTAGE_PART_RE);
      if (pmMatch) {
        const pmText = pmMatch[0].trim();
        // Ensure parens
        let formattedPm = pmText;
        if (!formattedPm.startsWith("(") || !formattedPm.endsWith(")")) {
           // It might have one paren or none. Clean and wrap.
           const inner = pmText.replace(/^[\(\)]+|[\(\)]+$/g, "").trim();
           formattedPm = `(${inner})`;
        }
        
        currentSceneNum = `${currentSceneNum} ${formattedPm}`;
        
        // Remove the photomontage part from 'next' to process the rest
        let remainder = normalizedNext.substring(pmMatch[0].length);
        remainder = ScreenplayClassifier.cleanupSceneHeaderRemainder(remainder); // Removes leading dashes/spaces
        
        if (!remainder) {
          consumedLines++;
          continue;
        }
        
        // Update 'next' with the remainder to be processed by subsequent checks (TL, Place, etc.)
        // We do NOT increment consumedLines here because we are technically still on the same line index 'i',
        // but we have 'consumed' the PM part. 
        // Actually, we ARE on line 'i'. If we finish processing 'remainder' as a place, we are done with line 'i'.
        // So we should update 'next' and let it fall through.
        normalizedNext = remainder;
        
        // Note: We don't continue; we let the rest of the logic handle 'next' (the place).
      }

      // 2. Prepare text for Time/Location check (handle parentheses)
      let textToCheck = normalizedNext;
      const isParenthesized = normalizedNext.startsWith("(") && normalizedNext.endsWith(")");
      if (isParenthesized) {
        textToCheck = normalizedNext.slice(1, -1).trim();
      }

      const timeLocationIsInOutOnly = !!timeLocation && inOutOnlyRe.test(timeLocation);
      const timeLocationIsTimeOnly = !!timeLocation && timeOnlyRe.test(timeLocation);
      
      // If we don't have a complete TL yet, check if this line provides it
      if (!timeLocation || timeLocationIsInOutOnly || timeLocationIsTimeOnly) {
        const tlOnlyRe = new RegExp(
          `^\\s*${ScreenplayClassifier.TL_REGEX.source}\\s*$`,
          "i"
        );

        if (tlOnlyRe.test(textToCheck)) {
          timeLocation = textToCheck; // Use the inner text if parenthesized? Or the whole line? usually inner for T/L
          consumedLines++;
          continue;
        }

        if (!timeLocation && (inOutOnlyRe.test(textToCheck) || timeOnlyRe.test(textToCheck))) {
          timeLocation = textToCheck;
          consumedLines++;
          continue;
        }

        if (timeLocationIsInOutOnly && timeOnlyRe.test(textToCheck)) {
          timeLocation = `${timeLocation.trim()} - ${textToCheck}`;
          consumedLines++;
          continue;
        }

        if (timeLocationIsTimeOnly && inOutOnlyRe.test(textToCheck)) {
          timeLocation = `${textToCheck} - ${timeLocation.trim()}`;
          consumedLines++;
          continue;
        }
      }

      if (ScreenplayClassifier.isSceneHeaderStart(normalizedNext)) break;
      if (ScreenplayClassifier.isTransition(normalizedNext)) break;
      if (ScreenplayClassifier.isParenShaped(normalizedNext) && !isParenthesized) break;
      if (ScreenplayClassifier.parseInlineCharacterDialogue(normalizedNext)) break;

      const trimmedNext = normalizedNext.trim();
      const endsWithSentencePunct = /[\.!\؟\?]$/.test(trimmedNext);
      const hasEllipsis = /(\.\.\.|…)/.test(trimmedNext);
      if (endsWithSentencePunct || hasEllipsis) break;

      // Check for Known Place (Scene Header 3) - Prioritize over Character
      if (ScreenplayClassifier.KNOWN_PLACES_RE.test(normalizedNext)) {
        // الخطوة 6: تحقق من وجود شرطة تفصل المكان عن وصف الأكشن
        const dashSeparatorMatch = normalizedNext.match(/^([^-–—]+)\s*[-–—]\s*(.+)$/);
        if (dashSeparatorMatch) {
          const placePart = dashSeparatorMatch[1].trim();
          const actionPart = dashSeparatorMatch[2].trim();
          
          // الخطوة 6: كاشف الأفعال - منع Action من التبلع
          const VERB_RE = /(يدخل|يخرج|يقف|يجلس|ينظر|يتحرك|يقترب|يبتعد|يركض|يمشي|يتحدث|يصرخ|تدخل|تخرج|تقف|تجلس|تنظر|تتحرك|تقترب|تبتعد|تركض|تمشي|تتحدث|تصرخ)/;
          if (VERB_RE.test(actionPart)) {
            // ده Action مش مكان - حفظ الجزء الأول كمكان والثاني كـ action
            placeParts.push(placePart);
            consumedLines++;
            remainingAction = actionPart;
            break;
          }
          
          // تحقق أن الجزء الأول هو مكان معروف
          if (ScreenplayClassifier.KNOWN_PLACES_RE.test(placePart)) {
            placeParts.push(placePart);
            consumedLines++;
            // حفظ الجزء الثاني ليُعالج كـ action
            remainingAction = actionPart;
            break;
          }
        }
        const wordCount = ScreenplayClassifier.wordCount(normalizedNext);
        const hasColon = normalizedNext.includes(":") || normalizedNext.includes("：");
        if (
          wordCount <= 6 &&
          !hasColon &&
          !ScreenplayClassifier.isActionVerbStart(normalizedNext) &&
          !ScreenplayClassifier.hasSentencePunctuation(normalizedNext)
        ) {
          placeParts.push(normalizedNext);
          consumedLines++;
          continue;
        }

        break;
      }

      const isChar = ScreenplayClassifier.isCharacterLine(normalizedNext, {
        lastFormat: "action",
        isInDialogueBlock: false,
      });

      if (isChar) {
        // If it has a colon, it's definitely a character (or specific format). Break.
        if (normalizedNext.includes(":") || normalizedNext.includes("：")) {
          break;
        }
        
        // If NO colon, it's ambiguous (Arabic text).
        // If we haven't found a place yet, and we have a header/TL, treat it as a Place.
        // This covers cases like "منزل عبد العزيز" even if "منزل" wasn't in the list (though it is).
        // It also covers "Cairo" or other proper nouns used as places.
        // But we must be careful not to consume a Character name if the Place was implicit or missing.
        // Heuristic: If we already have some place parts, maybe break? 
        // Or just assume anything following T/L that isn't an obvious Action/Transition/SceneHeader IS part of the place.
        
        // Let's assume if it looks like a character (short, no colon) BUT we are in the header block, it's a place.
        placeParts.push(normalizedNext);
        consumedLines++;
        continue;
      }

      if (ScreenplayClassifier.isLikelyAction(normalizedNext)) break;

      if (ScreenplayClassifier.isActionVerbStart(normalizedNext)) break;

      placeParts.push(normalizedNext);
      consumedLines++;
    }

    const place = placeParts
      .map((p) => ScreenplayClassifier.cleanupSceneHeaderRemainder(p))
      .filter(Boolean)
      .join(" - ");

    // تنظيف رقم المشهد والوقت/المكان من الرموز الزائدة
    const cleanedTimeLocation = ScreenplayClassifier.normalizeLine(timeLocation);

    return {
      sceneNum: ScreenplayClassifier.normalizeLine(currentSceneNum),
      timeLocation: cleanedTimeLocation,
      place,
      consumedLines,
      remainingAction,
    };
  }

  static isTransition(line: string): boolean {
    return ScreenplayClassifier.TRANSITION_RE.test(line);
  }

  static isParenShaped(line: string): boolean {
    return ScreenplayClassifier.PARENTHETICAL_SHAPE_RE.test(line);
  }

  static isCharacterLine(
    line: string,
    context?: { lastFormat: string; isInDialogueBlock: boolean }
  ): boolean {
    if (
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const wordCount = ScreenplayClassifier.wordCount(line);
    if (wordCount > 7) return false;

    const normalized = ScreenplayClassifier.normalizeLine(line);
    if (ScreenplayClassifier.isActionVerbStart(normalized)) return false;

    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) return false;

    const hasColon = line.includes(":") || line.includes("：");
    const arabicCharacterPattern =
      /^[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+[:\s]*$/;

    const trimmed = line.trim();
    if (hasColon && (trimmed.endsWith(":") || trimmed.endsWith("："))) {
      return true;
    }

    if (arabicCharacterPattern.test(line)) {
      return true;
    }

    if (!hasColon) return false;

    if (context) {
      if (context.isInDialogueBlock) {
        if (context.lastFormat === "character") {
          return (
            ScreenplayClassifier.CHARACTER_RE.test(line) ||
            arabicCharacterPattern.test(line)
          );
        }
        if (context.lastFormat === "dialogue") {
          return false;
        }
      }

      if (context.lastFormat === "action" && hasColon) {
        return (
          ScreenplayClassifier.CHARACTER_RE.test(line) ||
          arabicCharacterPattern.test(line)
        );
      }
    }

    return (
      ScreenplayClassifier.CHARACTER_RE.test(line) ||
      arabicCharacterPattern.test(line)
    );
  }

  static isLikelyAction(line: string): boolean {
    if (
      ScreenplayClassifier.isBlank(line) ||
      ScreenplayClassifier.isBasmala(line) ||
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isCharacterLine(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const normalized = ScreenplayClassifier.normalizeLine(line);

    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) return true;

    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      return true;
    }

    return false;
  }

  static matchesActionStartPattern(line: string): boolean {
    const normalized = ScreenplayClassifier.normalizeLine(line);
    const wordCount = this.wordCount(normalized);

    // === جديد: كلمة واحدة لا تُعتبر action تلقائياً ===
    // هذا يمنع ابتلاع أسماء مثل "ياسين" و"يوسف"
    if (wordCount === 1) {
      // فقط الأفعال المؤكدة في ACTION_VERB_SET
      const firstWord = normalized.trim();
      return ScreenplayClassifier.ACTION_VERB_SET.has(firstWord);
    }

    // الأنماط الموجودة (للسطور متعددة الكلمات)
    const actionStartPatterns = [
      /^\s*(?:[-–—]\s*)?(?:(?:ثم\s+)|(?:و(?:هو|هي)\s+)|(?:و\s+))*ل?(?:نرى|ننظر|نسمع|نلاحظ|يبدو|يظهر|يبدأ|ينتهي|يستمر|يتوقف|يتحرك|يحدث|يكون|يوجد|توجد|تظهر)(?:\s+\S|$)/,
      /^\s*(?:و|ف)?(?:لنرى|نرى|نسمع|نلاحظ|نقترب|نبتعد|ننتقل)(?:\s+\S|$)/,
      // تعديل: إضافة شرط كلمة بعد الفعل
      /^\s*(?:و|ف)?[يت][\u0600-\u06FF]{2,}\s+\S/,  // لازم يكون فيه كلمة بعد الفعل
      /^\s*(?:ثم\s+)?(?:(?:و(?:هو|هي)\s+)|(?:و\s+))*[يت][\u0600-\u06FF]{2,}\s+\S/,
      /^\s*(?:ثم\s+|و(?:هو|هي)\s+)(?:ل)?[يت][\u0600-\u06FF]+\s+\S/,
      /^\s*[-–—]\s*(?:(?:ثم\s+)|(?:و(?:هو|هي)\s+)|(?:و\s+))*[يت][\u0600-\u06FF]+\s+\S/,
      /^\s*(?:لنرى|لينظر|ليتجها|ليتجه|ليجلسا|ليجلس|لينهض|ليبتعد)(?:\s+\S|$)/,
    ];

    return actionStartPatterns.some((pattern) => pattern.test(normalized));
  }

  static getEnterSpacingRule(prevType: string, nextType: string): boolean | null {
    // === جديد: تجاهل blank في قواعد التباعد ===
    if (prevType === 'blank' || nextType === 'blank') {
      return null;  // لا قاعدة محددة
    }

    if (
      prevType === "basmala" &&
      (nextType === "scene-header-1" || nextType === "scene-header-top-line")
    ) {
      return true;
    }
    if (prevType === "scene-header-3" && nextType === "action") return true;
    if (prevType === "action" && nextType === "action") return true;
    if (prevType === "action" && nextType === "character") return true;
    if (prevType === "character" && nextType === "dialogue") return false;
    if (prevType === "dialogue" && nextType === "character") return true;
    if (prevType === "dialogue" && nextType === "action") return true;
    if (prevType === "dialogue" && nextType === "transition") return true;
    if (prevType === "action" && nextType === "transition") return true;
    if (
      prevType === "transition" &&
      (nextType === "scene-header-1" || nextType === "scene-header-top-line")
    ) {
      return true;
    }
    return null;
  }

  static applyEnterSpacingRules(
    lines: { text: string; type: string }[]
  ): { text: string; type: string }[] {
    const result: { text: string; type: string }[] = [];
    let prevNonBlankType: string | null = null;
    let pendingBlanks: { text: string; type: string }[] = [];

    const isBlankLine = (line: { text: string; type: string }): boolean => {
      if (line.type !== "action") return false;
      return (line.text || "").trim() === "";
    };

    for (const line of lines) {
      if (isBlankLine(line)) {
        pendingBlanks.push(line);
        continue;
      }

      if (!prevNonBlankType) {
        result.push(...pendingBlanks);
        pendingBlanks = [];
        result.push(line);
        prevNonBlankType = line.type;
        continue;
      }

      const spacingRule = ScreenplayClassifier.getEnterSpacingRule(
        prevNonBlankType,
        line.type
      );

      if (spacingRule === true) {
        if (pendingBlanks.length > 0) {
          result.push(pendingBlanks[0]);
        } else {
          result.push({ text: "", type: "action" });
        }
      } else if (spacingRule === false) {
        // لا نضيف السطور الفارغة - نتجاهلها
      } else if (spacingRule === null) {
        result.push(...pendingBlanks);
      }

      pendingBlanks = [];
      result.push(line);
      prevNonBlankType = line.type;
    }

    result.push(...pendingBlanks);
    return result;
  }

  static isSceneHeader1(line: string): boolean {
    return /^\s*(?:مشهد|م\.|scene)\s*[0-9٠-٩]+\s*$/i.test(line);
  }

  /**
   * دالة التصنيف بالدفعات (Batch) للنظام الجديد
   * @param text النص الكامل للسيناريو
   * @param useContext استخدام نظام التصنيف السياقي الجديد (افتراضي: false للحفاظ على التوافق)
   * @param documentMemory ذاكرة المستند (اختياري)
   * @param options خيارات إضافية للتصنيف
   * @returns مصفوفة من السطور المصنفة
   */
  static classifyBatch(
    text: string, 
    useContext: boolean = false,
    documentMemory?: DocumentMemory,
    options: {
      includeDoubtScore?: boolean;
      enableAIReview?: boolean;
      aiReviewThreshold?: number;
    } = {
      includeDoubtScore: true,  // تفعيل doubtScore افتراضياً
      enableAIReview: false,
      aiReviewThreshold: 20
    }
  ): { text: string; type: string; doubtScore?: number }[] {
    const lines = text.split(/\r?\n/);
    const results: { text: string; type: string }[] = [];
    const previousTypes: (string | null)[] = new Array(lines.length).fill(null); // تخزين الأنواع المُصنّفة بحسب رقم السطر

    // مسح الذاكرة في بداية كل batch جديد (اختياري - معلق حالياً)
    // if (documentMemory) documentMemory.clear();

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i] || "";
      const current = rawLine.trim();

      // === تعديل: استخدام blank بدلاً من action للسطور الفارغة ===
      if (!current) {
        results.push({ text: "", type: "blank" });
        previousTypes[i] = "blank";
        continue;
      }

      // تنظيف السطر من الرموز الزائدة قبل التصنيف
      const cleanedCurrent = ScreenplayClassifier.normalizeLine(current);

      // إذا أصبح السطر فارغاً بعد التنظيف (مثل سطر يحتوي فقط على نقطة أو شرطة)، نعامله كسطر فارغ
      if (!cleanedCurrent) {
        results.push({ text: "", type: "blank" });
        previousTypes[i] = "blank";
        continue;
      }

      // 1. استخراج رأس المشهد (المنطق الموجود - بدون تغيير)
      const sceneHeaderParts = ScreenplayClassifier.extractSceneHeaderParts(
        lines,
        i
      );
      if (sceneHeaderParts) {
        const sceneHeaderTopText = [
          sceneHeaderParts.sceneNum,
          sceneHeaderParts.timeLocation,
        ]
          .map((part) => (part || "").trim())
          .filter((part) => part.length > 0)
          .join(" ");

        results.push({
          text: sceneHeaderTopText,
          type: "scene-header-top-line",
        });
        previousTypes[i] = "scene-header-top-line";

        for (let j = i + 1; j < i + sceneHeaderParts.consumedLines; j++) {
          const isLastConsumed = j === i + sceneHeaderParts.consumedLines - 1;
          previousTypes[j] = sceneHeaderParts.place && isLastConsumed
            ? "scene-header-3"
            : "scene-header-top-line";
        }

        if (sceneHeaderParts.place) {
          results.push({ text: sceneHeaderParts.place, type: "scene-header-3" });
        }

        // إضافة الجزء المتبقي كـ action إذا وُجد
        if (sceneHeaderParts.remainingAction) {
          results.push({ text: sceneHeaderParts.remainingAction, type: "action" });
        }

        i += Math.max(0, sceneHeaderParts.consumedLines - 1);
        continue;
      }

      // 2. استخراج الحوار المضمن (المنطق الموجود - بدون تغيير)
      const inlineCharacterDialogue = ScreenplayClassifier.parseInlineCharacterDialogue(
        rawLine
      );
      if (inlineCharacterDialogue) {
        results.push({
          text: `${inlineCharacterDialogue.characterName}:`,
          type: "character",
        });

        results.push({
          text: inlineCharacterDialogue.dialogueText,
          type: "dialogue",
        });
        previousTypes[i] = "character";

        continue;
      }

      // 3. استخراج Bullet Character (المنطق الموجود - بدون تغيير)
      const bulletMatch = rawLine.match(ScreenplayClassifier.BULLET_CHARACTER_RE);
      if (bulletMatch) {
        const characterName = (bulletMatch[1] || "").trim();
        const dialogueText = (bulletMatch[2] || "").trim();

        if (characterName) {
          results.push({ text: `${characterName}:`, type: "character" });

          if (dialogueText) {
            results.push({ text: dialogueText, type: "dialogue" });
            previousTypes[i] = "dialogue";
          } else {
            previousTypes[i] = "character";
          }
          continue;
        }
      }

      // 4. التصنيف باستخدام النظام الجديد أو القديم
      if (useContext) {
        // استخدام نظام النقاط السياقي الجديد مع تمرير previousTypes والذاكرة
        const result = ScreenplayClassifier.classifyWithScoring(
          cleanedCurrent, 
          i, 
          lines, 
          previousTypes,
          documentMemory  // تمرير الذاكرة
        );
        results.push({ text: cleanedCurrent, type: result.type });
        previousTypes[i] = result.type;
      } else {
        // استخدام classifyHybrid القديم (للتوافق)
        const prevType = results.length > 0 ? results[results.length - 1].type : null;
        const nextLine = i < lines.length - 1 ? (lines[i + 1] || "").trim() : null;
        const type = ScreenplayClassifier.classifyHybrid(cleanedCurrent, prevType, nextLine);
        results.push({ text: cleanedCurrent, type });
        previousTypes[i] = type;
      }
    }

    // تطبيق قواعد المسافات (Enter Spacing Rules) بعد التصنيف النهائي
    const spacedResults = ScreenplayClassifier.applyEnterSpacingRules(results);
    
    // === نظام المراجعة الذكي بـ AI (الخيار 2: هجين) ===
    const { includeDoubtScore = false, enableAIReview = false, aiReviewThreshold = 20 } = options;
    
    if (includeDoubtScore || enableAIReview) {
      // حساب doubtScore لكل سطر
      const linesWithDoubt = spacedResults.map((r, idx) => {
        const prevResult = idx > 0 ? spacedResults[idx - 1] : undefined;
        const nextResult = idx < spacedResults.length - 1 ? spacedResults[idx + 1] : undefined;
        
        const currentLine: ClassifiedLine = {
          text: r.text,
          type: (r.type === 'blank' ? 'action' : r.type) as ViterbiState
        };
        
        const prevLine: ClassifiedLine | undefined = prevResult ? {
          text: prevResult.text,
          type: (prevResult.type === 'blank' ? 'action' : prevResult.type) as ViterbiState
        } : undefined;
        
        const nextLine: ClassifiedLine | undefined = nextResult ? {
          text: nextResult.text,
          type: (nextResult.type === 'blank' ? 'action' : nextResult.type) as ViterbiState
        } : undefined;
        
        const doubtScore = ClassifierReviewer.calculateDoubtScore(
          currentLine,
          { prevLine, nextLine }
        );
        
        return {
          ...r,
          type: r.type === 'blank' ? 'action' : r.type,
          doubtScore
        };
      });
      
      // إذا كانت المراجعة بـ AI مفعّلة
      if (enableAIReview) {
        // تشغيل المراجعة بشكل غير متزامن (async)
        // ملاحظة: هذا يتطلب تحويل الدالة إلى async أو استخدام callback
        // للحفاظ على التوافق، سنرجع النتائج مع doubtScore فقط
        // والمراجعة ستتم في خطوة منفصلة
        console.log('[ScreenplayClassifier] AI Review enabled - use reviewClassificationAsync() for full review');
      }
      
      return linesWithDoubt;
    }
    
    // === جديد: تحويل blank إلى action في الإخراج النهائي للتوافق ===
    return spacedResults.map(r => ({
      ...r,
      type: r.type === 'blank' ? 'action' : r.type
    }));
  }

  /**
   * دالة التصنيف بالدفعات باستخدام ذاكرة المستند الخاصة بهذا الـ instance
   * @param text النص الكامل للسيناريو
   * @param useContext استخدام نظام التصنيف السياقي الجديد (افتراضي: true)
   * @returns مصفوفة من السطور المصنفة
   */
  classifyBatchWithMemory(text: string, useContext: boolean = true): { text: string; type: string }[] {
    return ScreenplayClassifier.classifyBatch(text, useContext, this.documentMemory);
  }

  /**
   * دالة التصنيف مع المراجعة الذكية بـ AI (الخيار 2: هجين)
   * نظام أساسي داخلي للمراجعة التلقائية
   * @param text النص الكامل للسيناريو
   * @param useContext استخدام نظام التصنيف السياقي
   * @param documentMemory ذاكرة المستند
   * @param reviewThreshold حد الشك للمراجعة (افتراضي: 20)
   * @returns Promise بالنتائج المراجعة
   */
  static async classifyBatchWithAIReview(
    text: string,
    useContext: boolean = false,
    documentMemory?: DocumentMemory,
    reviewThreshold: number = 20
  ): Promise<{ text: string; type: string; doubtScore?: number }[]> {
    // الخطوة 1: التصنيف الأولي مع doubtScore
    const initialResults = this.classifyBatch(text, useContext, documentMemory, {
      includeDoubtScore: true,
      enableAIReview: false
    });

    // الخطوة 2: المراجعة بـ AI (الخيار 2: هجين)
    // استخدام الخيار 2 (هجين) للمراجعة
    const reviewedLines = [];
    for (let idx = 0; idx < initialResults.length; idx++) {
      const line = initialResults[idx];
      const prevLine = idx > 0 ? initialResults[idx - 1] : undefined;
      const nextLine = idx < initialResults.length - 1 ? initialResults[idx + 1] : undefined;

      // تحويل إلى ClassifiedLine
      const classifiedLine: ClassifiedLine = {
        text: line.text,
        type: line.type as ViterbiState
      };
      
      const prevClassifiedLine = prevLine ? { text: prevLine.text, type: prevLine.type as ViterbiState } : undefined;
      const nextClassifiedLine = nextLine ? { text: nextLine.text, type: nextLine.type as ViterbiState } : undefined;

      // حساب doubtScore بالخيار 2 (هجين: قواعد + AI للمتوسطة)
      const hybridDoubt = await ClassifierReviewer.calculateDoubtScoreHybrid(
        classifiedLine,
        { prevLine: prevClassifiedLine, nextLine: nextClassifiedLine }
      );

      reviewedLines.push({
        ...line,
        doubtScore: hybridDoubt
      });
    }

    // الخطوة 3: المراجعة الكاملة للأسطر المشكوك فيها
    const reviewedLinesTyped: ClassifiedLine[] = reviewedLines.map(line => ({
      text: line.text,
      type: line.type as ViterbiState
    }));
    
    const { reviewed } = await ClassifierReviewer.reviewClassification(
      reviewedLinesTyped,
      {
        reviewAll: false,
        doubtThreshold: reviewThreshold,
        enablePerformanceTracking: false
      }
    );

    return reviewed;
  }

  /**
   * الدالة الهجينة (المنطق المدمج) - تجمع بين فحص المحتوى والسياق
   * @param current السطر الحالي
   * @param prevType نوع السطر السابق
   * @param nextLine السطر التالي
   * @param allLines جميع السطور (اختياري - لنظام النقاط)
   * @param index فهرس السطر الحالي (اختياري - لنظام النقاط)
   * @param useScoring استخدام نظام النقاط (افتراضي: false)
   * @returns نوع السطر المصنف
   */
  static classifyHybrid(
    current: string,
    prevType: string | null,
    nextLine: string | null,
    allLines?: string[],
    index?: number,
    useScoring: boolean = false
  ): string {
    // إذا طُلب استخدام النقاط وتوفرت البيانات الكاملة
    if (useScoring && allLines && index !== undefined) {
      const result = ScreenplayClassifier.classifyWithContext(current, index, allLines);
      return result.type;
    }

    // خلاف ذلك، استخدم المنطق القديم (للتوافق)

    // 1. فحص المحتوى الصارم (Regex)
    if (this.isSceneHeader1(current)) return 'scene-header-1';
    if (this.isSceneHeaderStart(current)) return 'scene-header-top-line';
    if (this.isTransition(current)) return 'transition';
    if (this.isBasmala(current)) return 'basmala';

    if (this.isLikelyAction(current)) return 'action';

    // 2. فحص السياق (Context)

    // Scene Header 3 (المكان الكامل: أساسي أو فرعي)
    if (prevType && ['scene-header-1', 'scene-header-2', 'scene-header-top-line'].includes(prevType)) {
      const wordCount = current.split(' ').length;
      const hasColon = current.includes(":") || current.includes("：");
      // تحقق أقوى: لا يبدأ بفعل حركي ولا يحتوي على علامات ترقيم
      const normalized = this.normalizeLine(current);
      if (wordCount <= 6 && !hasColon && !this.isActionVerbStart(normalized) && !this.hasSentencePunctuation(normalized)) {
        return 'scene-header-3';
      }
    }

    // Character (شخصية)
    const looksLikeDialogueNext = nextLine && !this.isSceneHeaderStart(nextLine) && !this.isTransition(nextLine);
    const normalized = this.normalizeLine(current);
    if (looksLikeDialogueNext && current.length < 40 && !current.endsWith('.') && !this.isActionVerbStart(normalized)) {
      // تحقق إضافي: لا يحتوي على علامات ترقيم كثيرة
      if (!this.hasSentencePunctuation(normalized) || (normalized.includes(':') || normalized.includes('：'))) {
        return 'character';
      }
    }

    // Dialogue (حوار)
    if (prevType === 'character' || prevType === 'parenthetical') {
      if (this.isLikelyAction(current)) return 'action';
      return 'dialogue';
    }

    // Parenthetical (ملاحظة)
    if (current.startsWith('(') && ['character', 'dialogue'].includes(prevType || '')) return 'parenthetical';

    return 'action';
  }

  // ========================================================================
  // دوال التسجيل (Scoring Functions)
  // ========================================================================

  /**
   * فحص إذا كان السطر يبدأ بشرطة
   * @param rawLine السطر الأصلي
   * @returns true إذا يبدأ بشرطة
   */
  private static startsWithDash(rawLine: string): boolean {
    return /^[\s]*[-–—−‒―]/.test(rawLine);
  }

  /**
   * فحص إذا كان السطر يبدأ بشرطة مع نص بعدها
   * @param rawLine السطر الأصلي
   * @returns true إذا يبدأ بشرطة ويتبعها نص
   */
  private static startsWithDashAndText(rawLine: string): boolean {
    return /^[\s]*[-–—−‒―]\s*\S/.test(rawLine);
  }

  /**
   * فحص إذا كان السطر الحالي داخل بلوك حوار
   * بلوك الحوار يبدأ بـ character وينتهي عند scene-header أو transition أو action مؤكد
   * @param previousTypes الأنواع السابقة
   * @param currentIndex الفهرس الحالي
   * @returns معلومات عن بلوك الحوار
   */
  private static getDialogueBlockInfo(
    previousTypes: (string | null)[],
    currentIndex: number
  ): { 
    isInDialogueBlock: boolean; 
    blockStartType: string | null;
    distanceFromCharacter: number;
  } {
    const dialogueBlockTypes = ['character', 'dialogue', 'parenthetical'];
    const blockBreakers = ['scene-header-1', 'scene-header-2', 'scene-header-3', 
                           'scene-header-top-line', 'transition', 'basmala'];
    
    let distanceFromCharacter = -1;
    let lastCharacterIndex = -1;
    
    // البحث للخلف عن بداية البلوك
    for (let i = currentIndex - 1; i >= 0; i--) {
      const type = previousTypes[i];
      
      // تخطي السطور الفارغة
      if (type === 'blank' || type === null) continue;
      
      // إذا وصلنا لكاسر بلوك، نحن خارج الحوار
      if (blockBreakers.includes(type)) {
        return { 
          isInDialogueBlock: false, 
          blockStartType: null,
          distanceFromCharacter: -1
        };
      }
      
      // إذا وجدنا character، نحن في بلوك حوار
      if (type === 'character') {
        lastCharacterIndex = i;
        distanceFromCharacter = currentIndex - i;
        return { 
          isInDialogueBlock: true, 
          blockStartType: 'character',
          distanceFromCharacter
        };
      }
      
      // إذا وجدنا dialogue أو parenthetical، نستمر للخلف
      if (type === 'dialogue' || type === 'parenthetical') {
        continue;
      }
      
      // إذا وجدنا action، نحن خارج بلوك الحوار
      if (type === 'action') {
        return { 
          isInDialogueBlock: false, 
          blockStartType: null,
          distanceFromCharacter: -1
        };
      }
    }
    
    return { 
      isInDialogueBlock: false, 
      blockStartType: null,
      distanceFromCharacter: -1
    };
  }

  /**
   * Pass أول سريع لجمع الشخصيات عالية الثقة
   * يُستدعى قبل التصنيف الكامل
   * @param lines جميع السطور
   */
  preProcessForCharacters(lines: string[]): void {
    for (const line of lines) {
      const trimmed = line.trim();
      
      // شخصية مؤكدة: تنتهي بـ : وقصيرة
      if ((trimmed.endsWith(':') || trimmed.endsWith('：')) && 
          ScreenplayClassifier.wordCount(trimmed) <= 5) {
        
        // تأكد أنها ليست scene header أو transition
        if (!ScreenplayClassifier.isSceneHeaderStart(trimmed) &&
            !ScreenplayClassifier.isTransition(trimmed)) {
          
          const name = trimmed.replace(/[:：\s]+$/, '');
          this.documentMemory.addCharacter(name, 'high');
        }
      }
    }
  }

  /**
   * بناء سياق السطر - نافذة قبل/بعد مع إحصائيات
   * @param line السطر الحالي
   * @param index فهرس السطر (zero-based)
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @returns سياق السطر
   */
  private static buildContext(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[]
  ): LineContext {
    const WINDOW_SIZE = 3;
    const normalized = this.normalizeForAnalysis(line);
    const wordCount = this.wordCount(normalized);
    const allLinesLength = allLines.length;

    // === تحسين: بناء نافذة السطور السابقة والتالية في حلقة واحدة ===
    const previousLines: { line: string; type: string }[] = [];
    const nextLines: { line: string }[] = [];
    let nextLine: string | null = null;
    let prevCollected = 0;
    let nextCollected = 0;
    
    // حلقة واحدة للبحث في الاتجاهين
    const maxRange = Math.max(WINDOW_SIZE, allLinesLength - index);
    for (let offset = 1; offset <= maxRange; offset++) {
      // البحث للخلف
      if (prevCollected < WINDOW_SIZE && index - offset >= 0) {
        const prevIndex = index - offset;
        const prevLine = allLines[prevIndex];
        const type = previousTypes?.[prevIndex] || 'unknown';
        
        if (type !== 'blank' && !this.isBlank(prevLine)) {
          previousLines.unshift({ line: prevLine, type });
          prevCollected++;
        }
      }
      
      // البحث للأمام
      if (index + offset < allLinesLength) {
        const nextIndex = index + offset;
        const currentNextLine = allLines[nextIndex];
        
        if (!this.isBlank(currentNextLine)) {
          if (!nextLine) nextLine = currentNextLine;
          if (nextCollected < WINDOW_SIZE) {
            nextLines.push({ line: currentNextLine });
            nextCollected++;
          }
        }
      }
      
      // إنهاء مبكر إذا جمعنا كل ما نحتاج
      if (prevCollected >= WINDOW_SIZE && nextCollected >= WINDOW_SIZE && nextLine) {
        break;
      }
    }
    
    // حساب الإحصائيات مرة واحدة
    const nextWordCount = nextLine ? this.wordCount(this.normalizeLine(nextLine)) : undefined;
    const nextLineLength = nextLine?.length ?? undefined;
    const nextHasPunctuation = nextLine ? this.hasSentencePunctuation(nextLine) : undefined;

    return {
      previousLines,
      nextLines,
      stats: {
        currentLineLength: normalized.length,
        currentWordCount: wordCount,
        nextLineLength,
        nextWordCount,
        hasPunctuation: this.hasSentencePunctuation(normalized),
        nextHasPunctuation
      }
    };
  }

  /**
   * حساب نقاط التصنيف كشخصية (Character)
   * @param rawLine السطر الأصلي (كما كتبه المستخدم)
   * @param normalized السطر بعد التنظيف للتحليل اللغوي
   * @param ctx سياق السطر
   * @param documentMemory ذاكرة المستند (اختياري)
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsCharacter(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    documentMemory?: any
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const trimmed = rawLine.trim();
    const wordCount = ctx.stats.currentWordCount;

    // === جديد: فحص القاموس أولاً ===
    if (documentMemory) {
      const nameToCheck = trimmed.replace(/[:：\s]+$/, '');
      const knownStatus = documentMemory.isKnownCharacter(nameToCheck);
      
      if (knownStatus) {
        if (knownStatus.confidence === 'high') {
          score += 60;
          reasons.push('شخصية معروفة من المستند (ثقة عالية)');
        } else if (knownStatus.confidence === 'medium') {
          score += 40;
          reasons.push('شخصية معروفة من المستند (ثقة متوسطة)');
        } else {
          score += 20;
          reasons.push('شخصية معروفة من المستند (ثقة منخفضة)');
        }
      }
    }

    // === تعديل: فحص أنماط الأكشن مشروط بالقاموس ===
    const looksLikeAction = this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized);
    
    if (looksLikeAction) {
      // إذا كان الاسم معروف في القاموس، لا تخصم كثيراً
      const nameToCheck = trimmed.replace(/[:：\s]+$/, '');
      const isKnown = documentMemory?.isKnownCharacter(nameToCheck);
      
      if (isKnown) {
        score -= 15;  // خصم أقل
        reasons.push('يشبه نمط حركة لكنه شخصية معروفة (سالب مخفف)');
      } else {
        score -= 45;  // الخصم الأصلي
        reasons.push('يبدو كسطر حركة (سالب)');
      }
    }

    // 1. ينتهي بنقطتين (:) أو (：) - 50 نقطة
    const endsWithColon = trimmed.endsWith(':') || trimmed.endsWith('：');
    if (endsWithColon) {
      score += 50;
      reasons.push('ينتهي بنقطتين');
    } else if (trimmed.includes(':') || trimmed.includes('：')) {
      score += 25;
      reasons.push('يحتوي على نقطتين');
    }

    // 2. طول السطر <= 3 كلمات (20 نقطة) أو <= 5 كلمات (10 نقاط)
    if (wordCount <= 3) {
      score += 20;
      reasons.push(`طول ${wordCount} كلمات (≤3)`);
    } else if (wordCount <= 5) {
      score += 10;
      reasons.push(`طول ${wordCount} كلمات (≤5)`);
    }

    // 3. لا يوجد علامات ترقيم نهائية (15 نقطة)
    if (!ctx.stats.hasPunctuation) {
      score += 15;
      reasons.push('لا يحتوي على علامات ترقيم نهائية');
    }

    const hasSentenceEndingPunct = /[\.!\؟\?]$/.test(trimmed) || /(\.\.\.|…)/.test(trimmed);
    if (hasSentenceEndingPunct && !endsWithColon) {
      score -= 35;
      reasons.push('يحتوي على علامات ترقيم (سالب)');
    }

    // 4. السطر التالي يبدو كحوار (25 نقطة)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && !this.isSceneHeaderStart(nextLine) && !this.isTransition(nextLine)) {
      const nextWordCount = ctx.stats.nextWordCount ?? 0;
      // الحوار عادة يكون أطول من اسم الشخصية وقد يحتوي على علامات ترقيم
      if (nextWordCount > 1 && nextWordCount <= 30) {
        score += 25;
        reasons.push('السطر التالي يبدو كحوار');
      }
    }

    // 5. لا يبدأ بفعل حركي (10 نقاط)
    if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
      score -= 20;
      reasons.push('يبدأ كنمط حركة (سالب)');
    }

    // 6. لا يطابق نمط الحركة (10 نقاط)
    // (تم إلغاء مكافأة "ليس حركة" لأنها تسبب رفع نقاط الشخصية بشكل خاطئ)

    // 7. أحرف عربية فقط (10 نقاط)
    const arabicOnly = /^[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF:：]+$/.test(trimmed);
    if (arabicOnly) {
      score += 10;
      reasons.push('أحرف عربية فقط');
    }

    // 8. السطر السابق ليس شخصية (لتجنب التكرار) - 5 نقاط
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (prevLine && prevLine.type !== 'character') {
      score += 5;
      reasons.push('السطر السابق ليس شخصية');
    }

    // 9. لا يبدأ بـ "صوت" (فقط إذا كان مع parenthetical) - لا نقاط
    if (normalized.startsWith('صوت') && !endsWithColon) {
      score -= 10;
      reasons.push('يبدأ بـ "صوت" ولكن بدون نقطتين');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كحوار (Dialogue)
   * @param rawLine السطر الأصلي (كما كتبه المستخدم)
   * @param normalized السطر بعد التنظيف للتحليل اللغوي
   * @param ctx سياق السطر
   * @param documentMemory ذاكرة المستند (اختياري)
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsDialogue(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    documentMemory?: any,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const wordCount = ctx.stats.currentWordCount;

    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];

    // 1. السطر السابق شخصية (40 نقطة)
    const isPrevCharacter = prevLine?.type === 'character';
    if (isPrevCharacter) {
      score += 40;
      reasons.push('السطر السابق شخصية');
    }

    // 1b. الشرطة داخل بلوك الحوار
    if (this.startsWithDash(rawLine)) {
      if (dialogueBlockInfo?.isInDialogueBlock) {
        // داخل بلوك الحوار: الشرطة غالباً استكمال حوار
        score += 35;
        reasons.push('يبدأ بشرطة داخل بلوك حوار (استكمال/نبرة)');
        
        // مكافأة إضافية إذا قريب من الشخصية
        if (dialogueBlockInfo.distanceFromCharacter <= 3) {
          score += 15;
          reasons.push('قريب من سطر الشخصية');
        }
      } else {
        // خارج بلوك الحوار: الشرطة ليست دليل حوار
        score -= 15;
        reasons.push('يبدأ بشرطة خارج بلوك الحوار (سالب)');
      }
    }

    // 1c. علامات الحوار المستمر
    if (dialogueBlockInfo?.isInDialogueBlock) {
      // Ellipsis في البداية = استكمال
      if (/^[\s]*\.\.\./.test(rawLine) || /^[\s]*…/.test(rawLine)) {
        score += 25;
        reasons.push('يبدأ بـ ... (استكمال حوار)');
      }
      
      // علامات اقتباس
      if (/^[\s]*["«"]/.test(rawLine)) {
        score += 20;
        reasons.push('يبدأ بعلامة اقتباس');
      }
    }

    const isPrevParenthetical = prevLine?.type === 'parenthetical';
    const isPrevDialogue = prevLine?.type === 'dialogue';
    const hasDialogueContext = isPrevCharacter || isPrevParenthetical || isPrevDialogue;

    if (!hasDialogueContext) {
      score -= 60;
      reasons.push('لا يوجد سياق حوار (سالب)');

      if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
        score -= 20;
        reasons.push('يبدو كسطر حركة بدون سياق حوار (سالب)');
      }
    }

    // 1. السطر السابق شخصية (60 نقطة)
    if (isPrevCharacter) {
      score += 60;
      reasons.push('السطر السابق شخصية');
    }

    // 2. السطر السابق ملاحظة (50 نقطة)
    if (isPrevParenthetical) {
      score += 50;
      reasons.push('السطر السابق ملاحظة');
    }

    if (isPrevDialogue) {
      score += 35;
      reasons.push('استمرار حوار');
    }

    // 3. ينتهي بعلامة ترقيم (15 نقطة)
    if (ctx.stats.hasPunctuation) {
      score += 15;
      reasons.push('ينتهي بعلامة ترقيم');
    }

    // 4. طول مناسب للحوار (15 نقطة) - بين 2 و 50 كلمة
    if (wordCount >= 2 && wordCount <= 50) {
      score += 15;
      reasons.push(`طول مناسب ${wordCount} كلمات`);
    } else if (wordCount >= 1 && wordCount <= 60) {
      score += 8;
      reasons.push(`طول مقبول ${wordCount} كلمات`);
    }

    // 5/6. إذا كان السطر يبدأ كنمط حركة، خفّض نقاط الحوار
    if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
      score -= 25;
      reasons.push('يبدأ كنمط حركة (سالب)');
    }

    // 7. ليس رأس مشهد (20 نقطة سلبية إذا كان)
    if (this.isSceneHeaderStart(normalized)) {
      score -= 20;
      reasons.push('يبدو كرأس مشهد (سالب)'); 
    }

    // 8. السطر التالي ليس شخصية أو ملاحظة (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && !this.isCharacterLine(nextLine)) {
      score += 10;
      reasons.push('السطر التالي ليس شخصية');
    }

    // 9. لا يحتوي على نقطتين (إلا إذا كان حوار inline) - 10 نقاط
    const hasColon = normalized.includes(':') || normalized.includes('：');
    if (!hasColon) {
      score += 10;
      reasons.push('لا يحتوي على نقطتين');
    } else if (normalized.match(/^[^:：]+[:：].+[:：]/)) {
      // يحتوي على أكثر من نقطتين - غالباً ليس حواراً صافياً
      score -= 10;
      reasons.push('يحتوي على أكثر من نقطتين (سالب)');
    }

    // 10. ليس قصيراً جداً (حوار من كلمة واحدة غير شائع) - 5 نقاط سلبية
    if (wordCount === 1 && !isPrevCharacter && !isPrevParenthetical) {
      score -= 5;
      reasons.push('كلمة واحدة بدون سياق حوار (سالب)');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كحركة (Action)
   * @param rawLine السطر الأصلي (كما كتبه المستخدم)
   * @param normalized السطر بعد التنظيف للتحليل اللغوي
   * @param ctx سياق السطر
   * @param documentMemory ذاكرة المستند (اختياري)
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsAction(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    documentMemory?: any,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const wordCount = ctx.stats.currentWordCount;

    // === جديد: خصم إذا كان اسم شخصية معروف ===
    if (documentMemory) {
      const trimmed = rawLine.trim().replace(/[:：\s]+$/, '');
      const knownStatus = documentMemory.isKnownCharacter(trimmed);
      
      if (knownStatus) {
        if (knownStatus.confidence === 'high') {
          score -= 50;
          reasons.push('اسم شخصية معروف (سالب قوي)');
        } else if (knownStatus.confidence === 'medium') {
          score -= 30;
          reasons.push('اسم شخصية معروف (سالب)');
        }
      }
    }

    // === تعديل: أنماط الأكشن مشروطة ===
    if (this.isActionVerbStart(normalized)) {
      // تحقق أن السطر ليس كلمة واحدة فقط (احتمال اسم شخصية)
      const wordCount = ctx.stats.currentWordCount;
      
      if (wordCount === 1) {
        score += 20;  // مكافأة أقل لكلمة واحدة
        reasons.push('يبدأ بفعل حركي (كلمة واحدة)');
      } else {
        score += 50;  // المكافأة الكاملة
        reasons.push('يبدأ بفعل حركي');
      }
    }

    // 2. يطابق نمط الحركة (40 نقطة)
    if (this.matchesActionStartPattern(normalized)) {
      score += 40;
      reasons.push('يطابق نمط الحركة');
    }

    // 3. بعد رأس مشهد (30 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (prevLine && (prevLine.type === 'scene-header-1' ||
                     prevLine.type === 'scene-header-2' ||
                     prevLine.type === 'scene-header-3' ||
                     prevLine.type === 'scene-header-top-line')) {
      score += 30;
      reasons.push('يأتي بعد رأس مشهد');
    }

    // 4. السطر التالي أيضاً حركة (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && this.isLikelyAction(nextLine)) {
      score += 10;
      reasons.push('السطر التالي يبدو كحركة');
    }

    // 5. يبدأ بشرطة - مشروطة بالسياق
    if (this.startsWithDash(rawLine)) {
      if (dialogueBlockInfo?.isInDialogueBlock) {
        // داخل بلوك الحوار: الشرطة ليست دليل action
        score -= 20;
        reasons.push('يبدأ بشرطة داخل بلوك حوار (سالب للأكشن)');
      } else {
        // خارج بلوك الحوار: الشرطة دليل action
        score += 25;
        reasons.push('يبدأ بشرطة خارج بلوك الحوار');
      }
    }

    // 5b. فعل حركي بعد شرطة أقوى
    if (this.startsWithDash(rawLine) && !dialogueBlockInfo?.isInDialogueBlock) {
      // إزالة الشرطة وفحص الفعل
      const withoutDash = rawLine.replace(/^[\s]*[-–—−‒―]\s*/, '');
      if (this.isActionVerbStart(withoutDash)) {
        score += 30;
        reasons.push('شرطة متبوعة بفعل حركي');
      }
    }

    // 6. طول نصي مناسب (أكثر من 5 كلمات عادة للحركة) - 10 نقاط
    if (wordCount > 5) {
      score += 10;
      reasons.push(`طول نصي مناسب (${wordCount} كلمات)`);
    }

    // 7. السطر السابق حركة (10 نقاط)
    if (prevLine && prevLine.type === 'action') {
      score += 10;
      reasons.push('السطر السابق حركة');
    }

    // 8. ليس شخصية أو حوار (20 نقطة سلبية إذا كان)
    if (this.isCharacterLine(normalized)) {
      score -= 20;
      reasons.push('يبدو كشخصية (سالب)');
    }

    // 9. لا ينتهي بنقطتين (5 نقاط)
    if (!normalized.endsWith(':') && !normalized.endsWith('：')) {
      score += 5;
      reasons.push('لا ينتهي بنقطتين');
    }

    // 10. يحتوي على كلمات وصفية (مثل "بطيء"، "سريع") - 5 نقاط
    const descriptiveWords = ['بطيء', 'سريع', 'فجأة', 'ببطء', 'بسرعة', 'هدوء', 'صمت'];
    const hasDescriptive = descriptiveWords.some(word => normalized.includes(word));
    if (hasDescriptive) {
      score += 5;
      reasons.push('يحتوي على كلمات وصفية');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كملاحظة (Parenthetical)
   * @param rawLine السطر الأصلي (كما كتبه المستخدم)
   * @param normalized السطر بعد التنظيف للتحليل اللغوي
   * @param ctx سياق السطر
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsParenthetical(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const trimmed = rawLine.trim();
    const wordCount = ctx.stats.currentWordCount;

    const isParenShaped = /^\s*\(.*\)\s*$/.test(trimmed);
    if (!isParenShaped) {
      // بدون أقواس لا يجب أن ينافس كـ Parenthetical إلا في حالات نادرة جداً
      score -= 70;
      reasons.push('ليس بين أقواس (سالب)');
    }

    // 1. يبدأ بقوس وينتهي بقوس (60 نقطة)
    if (/^\s*\(.*\)\s*$/.test(trimmed)) {
      score += 60;
      reasons.push('يبدأ وينتهي بأقواس');
    }

    // 2. السطر السابق شخصية (40 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    const isPrevCharacter = prevLine?.type === 'character';
    if (isPrevCharacter) {
      score += 40;
      reasons.push('السطر السابق شخصية');
    }

    // 3. السطر السابق حوار (30 نقطة)
    const isPrevDialogue = prevLine?.type === 'dialogue';
    if (isPrevDialogue) {
      score += 30;
      reasons.push('السطر السابق حوار');
    }

    // 4. قصير (عادة 1-5 كلمات) - 15 نقطة
    if (wordCount >= 1 && wordCount <= 5) {
      score += 15;
      reasons.push(`طول قصير (${wordCount} كلمات)`);
    } else if (wordCount <= 10) {
      score += 8;
      reasons.push(`طول متوسط (${wordCount} كلمات)`);
    }

    // 5. لا يبدأ بفعل حركي (10 نقاط)
    if (!this.isActionVerbStart(normalized)) {
      score += 10;
      reasons.push('لا يبدأ بفعل حركي');
    }

    // 5b. شرطة مع كلمة parenthetical
    if (this.startsWithDash(rawLine) && dialogueBlockInfo?.isInDialogueBlock) {
      const withoutDash = rawLine.replace(/^[\s]*[-–—−‒―]\s*/, '').trim();
      
      const parentheticalWords = [
        'همساً', 'بصوت', 'مبتسماً', 'باحتقار', 'بحزن', 'بغضب', 
        'بفرح', 'بنظرة', 'ساخراً', 'متعجباً', 'بحدة', 'بهدوء'
      ];
      
      const startsWithParentheticalWord = parentheticalWords.some(
        word => withoutDash.startsWith(word)
      );
      
      if (startsWithParentheticalWord && withoutDash.length < 30) {
        score += 40;
        reasons.push('شرطة مع كلمة ملاحظة داخل بلوك حوار');
      }
    }

    // 6. يحتوي على كلمات ملاحظات شائعة (10 نقاط)
    const parentheticalWords = [
      'همساً', 'بصوت', 'صوت', 'مبتسماً', 'باحتقار', 'بحزن',
      'بغضب', 'بفرح', 'بطريقة', 'بنظرة', 'بتحديق', 'بسرعة',
      'ببطء', 'فجأة', 'فوراً', 'وهو', 'وهي', 'مبتسما', 'مبتسم'
    ];
    const hasParentheticalWord = parentheticalWords.some(word => normalized.includes(word));
    if (hasParentheticalWord) {
      score += 10;
      reasons.push('يحتوي على كلمة ملاحظة شائعة');
    }

    // 7. لا يحتوي على علامات ترقيم نهائية (5 نقاط)
    if (!ctx.stats.hasPunctuation) {
      score += 5;
      reasons.push('لا يحتوي على علامات ترقيم نهائية');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كرأس مشهد (Scene Header)
   * @param line السطر الحالي
   * @param ctx سياق السطر
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsSceneHeader(
    line: string,
    ctx: LineContext
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const normalized = this.normalizeLine(line);

    // 1. يطابق نمط رأس المشهد (70 نقطة)
    if (this.isSceneHeaderStart(normalized)) {
      score += 70;
      reasons.push('يطابق نمط رأس المشهد');
    }

    // 2. يبدأ بـ "مشهد" أو "م." أو "scene" (50 نقطة)
    const scenePrefix = /^(?:مشهد|m\.|scene)\s*[0-9٠-٩]+/i;
    if (scenePrefix.test(normalized)) {
      score += 50;
      reasons.push('يبدأ بكلمة مشهد');
    }

    // 3. يحتوي على مكان (من الأماكن المعروفة) - 30 نقطة
    const knownPlaces = [
      'مسجد', 'بيت', 'منزل', 'شارع', 'حديقة', 'مدرسة', 'جامعة',
      'مكتب', 'محل', 'مستشفى', 'مطعم', 'فندق', 'سيارة', 'غرفة',
      'قاعة', 'ممر', 'سطح', 'ساحة', 'مقبرة', 'مخبز', 'مكتبة',
      'نهر', 'بحر', 'جبل', 'غابة', 'سوق', 'مصنع', 'بنك', 'محكمة',
      'سجن', 'موقف', 'محطة', 'مطار', 'ميناء', 'كوبرى', 'نفق',
      'مبنى', 'قصر', 'نادي', 'ملعب', 'ملهى', 'بار', 'كازينو',
      'متحف', 'مسرح', 'سينما', 'معرض', 'مزرعة', 'مختبر', 'مستودع',
      'كهف', 'قصر عدلي'
    ];
    const hasKnownPlace = knownPlaces.some(place => normalized.includes(place));
    if (hasKnownPlace) {
      score += 30;
      reasons.push('يحتوي على مكان معروف');
    }

    // 4. يحتوي على وقت (ليل/نهار/صباح/مساء...) - 25 نقطة
    const timeWords = ['ليل', 'نهار', 'صباح', 'مساء', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'الغروب'];
    const hasTimeWord = timeWords.some(word => normalized.includes(word));
    if (hasTimeWord) {
      score += 25;
      reasons.push('يحتوي على كلمة وقت');
    }

    // 5. يحتوي على داخلي/خارجي - 20 نقطة
    if (/داخلي|خارجي|د\.|خ\./i.test(normalized)) {
      score += 20;
      reasons.push('يحتوي على داخلي/خارجي');
    }

    // 6. السطر السابق انتقال أو فارغ (15 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (!prevLine || prevLine.type === 'transition' || prevLine.line.trim() === '') {
      score += 15;
      reasons.push('السطر السابق انتقال أو فارغ');
    }

    // 7. السطر التالي يبدو كوصف مكان (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && hasKnownPlace && nextLine.trim().length > 0) {
      if (!this.isCharacterLine(nextLine) && !this.isTransition(nextLine)) {
        score += 10;
        reasons.push('السطر التالي يبدو كوصف مكان');
      }
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب درجة الشك وتحديد الحاجة للمراجعة
   * @param scores جميع نقاط التصنيف
   * @returns درجة الشك وعلامة المراجعة
   */
  private static calculateDoubtScore(
    scores: { [type: string]: ClassificationScore }
  ): { doubtScore: number; needsReview: boolean } {
    const sortedScores = (Object.entries(scores) as [string, ClassificationScore][])
      .sort((a: [string, ClassificationScore], b: [string, ClassificationScore]) => b[1].score - a[1].score);
    
    const highest = sortedScores[0];
    const secondHighest = sortedScores[1];
    
    const scoreDiff = highest 
      ? (secondHighest ? highest[1].score - secondHighest[1].score : highest[1].score) 
      : 0;
    
    let doubtScore = 0;
    
    // 1. الفرق بين النقاط
    if (scoreDiff < 15) {
      doubtScore += 50;
    } else if (scoreDiff < 25) {
      doubtScore += 30;
    } else if (scoreDiff < 35) {
      doubtScore += 15;
    }
    
    // 2. النقاط المنخفضة عموماً
    if (highest && highest[1].score < 40) {
      doubtScore += 30;
    } else if (highest && highest[1].score < 55) {
      doubtScore += 15;
    }
    
    // 3. تعادل في النقاط العليا
    const maxScore = highest ? highest[1].score : 0;
    const ties = sortedScores.filter((s: [string, ClassificationScore]) => 
      Math.abs(s[1].score - maxScore) < ScreenplayClassifier.SCORE_TIE_THRESHOLD
    ).length;
    if (ties > 1) {
      doubtScore += 20;
    }
    
    // 4. الثقة المنخفضة
    if (highest && highest[1].confidence === 'low') {
      doubtScore += 20;
    } else if (highest && highest[1].confidence === 'medium') {
      doubtScore += 10;
    }
    
    const finalDoubtScore = Math.min(100, doubtScore);
    
    // === تحديد الحاجة للمراجعة ===
    const needsReview = finalDoubtScore >= ScreenplayClassifier.NEEDS_REVIEW_THRESHOLD;
    
    return { doubtScore: finalDoubtScore, needsReview };
  }

  /**
   * استخراج أعلى مرشحين للتصنيف مع التفاصيل
   * @param scores جميع نقاط التصنيف
   * @returns أعلى مرشحين أو null
   */
  private static extractTop2Candidates(
    scores: { [type: string]: ClassificationScore }
  ): [CandidateType, CandidateType] | null {
    const sortedEntries = (Object.entries(scores) as [string, ClassificationScore][])
      .sort((a: [string, ClassificationScore], b: [string, ClassificationScore]) => b[1].score - a[1].score);
    
    if (sortedEntries.length < 2) return null;
    
    const [first, second] = sortedEntries;
    
    return [
      {
        type: first[0],
        score: first[1].score,
        confidence: first[1].confidence,
        reasons: first[1].reasons
      },
      {
        type: second[0],
        score: second[1].score,
        confidence: second[1].confidence,
        reasons: second[1].reasons
      }
    ];
  }

  /**
   * تطبيق fallback ذكي عند التردد بين نوعين
   * @param top2 أعلى مرشحين
   * @param ctx السياق
   * @param prevNonBlankType نوع السطر السابق غير الفارغ
   * @param nextLine السطر التالي
   * @param currentLine السطر الحالي (للتحقق من الخصائص)
   * @returns النوع المُرجَّح مع السبب أو null
   */
  private static applySmartFallback(
    top2: [CandidateType, CandidateType],
    ctx: LineContext,
    prevNonBlankType: string | null,
    nextLine: string | null,
    currentLine: string
  ): { type: string; reason: string } | null {
    
    const [first, second] = top2;
    const scoreDiff = first.score - second.score;
    
    // لا نطبق fallback إذا الفرق كبير
    if (scoreDiff > 25) return null;
    
    const types = [first.type, second.type].sort();
    
    // === قاعدة 1: character vs action ===
    if (types[0] === 'action' && types[1] === 'character') {
      // إذا السطر التالي يبدو كحوار → character
      if (nextLine && !this.isSceneHeaderStart(nextLine) && !this.isTransition(nextLine)) {
        const nextNormalized = this.normalizeLine(nextLine);
        const nextWordCount = this.wordCount(nextNormalized);
        if (nextWordCount > 1 && nextWordCount <= 30) {
          return { 
            type: 'character', 
            reason: 'السطر التالي يبدو كحوار' 
          };
        }
      }
      
      // إذا لا يوجد سطر تالي أو السطر التالي ليس حوار → action
      return { 
        type: 'action', 
        reason: 'لا يوجد حوار بعده' 
      };
    }
    
    // === قاعدة 2: dialogue vs action ===
    if (types[0] === 'action' && types[1] === 'dialogue') {
      // إذا السطر السابق character أو parenthetical → dialogue
      if (prevNonBlankType === 'character' || prevNonBlankType === 'parenthetical') {
        return { 
          type: 'dialogue', 
          reason: 'يأتي بعد شخصية أو ملاحظة' 
        };
      }
      
      // إذا السطر السابق dialogue → dialogue (استمرار)
      if (prevNonBlankType === 'dialogue') {
        return { 
          type: 'dialogue', 
          reason: 'استمرار حوار' 
        };
      }
      
      return { 
        type: 'action', 
        reason: 'لا يوجد سياق حوار' 
      };
    }
    
    // === قاعدة 3: parenthetical vs action ===
    if (types[0] === 'action' && types[1] === 'parenthetical') {
      // إذا السطر السابق character أو dialogue → parenthetical
      if (prevNonBlankType === 'character' || prevNonBlankType === 'dialogue') {
        return { 
          type: 'parenthetical', 
          reason: 'يأتي بعد شخصية أو حوار' 
        };
      }
      
      return { 
        type: 'action', 
        reason: 'ليس في سياق حوار' 
      };
    }
    
    // === قاعدة 4: character vs dialogue ===
    if (types[0] === 'character' && types[1] === 'dialogue') {
      // إذا السطر السابق character → dialogue
      if (prevNonBlankType === 'character') {
        return { 
          type: 'dialogue', 
          reason: 'يأتي بعد شخصية' 
        };
      }
      
      // إذا ينتهي بنقطتين → character
      const trimmed = currentLine.trim();
      if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
        return { 
          type: 'character', 
          reason: 'ينتهي بنقطتين' 
        };
      }
    }
    
    // لا يوجد fallback مناسب
    return null;
  }

  /**
   * التصنيف بالسياق الذكي - باستخدام نظام النقاط مع درجة الشك
   * دالة عامة يمكن استدعاؤها من خارج الفئة
   * @param line السطر الحالي
   * @param index موقع السطر في النص
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @returns نتيجة التصنيف مع النقاط والسياق ودرجة الشك
   */
  public static classifyWithContext(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[]
  ): ClassificationResult {
    // استخدام classifyWithScoring بدلاً من إعادة تنفيذ المنطق
    return this.classifyWithScoring(line, index, allLines, previousTypes);
  }

  /**
   * فحص سريع للأنماط الثابتة (scene headers, transitions, etc.)
   * @param line السطر المراد فحصه
   * @returns نتيجة التصنيف أو null لو لم يتم التعرف على نمط ثابت
   */
  private static quickClassify(line: string): ClassificationResult | null {
    const trimmed = line.trim();

    // BASMALA -> basmala (high)
    if (this.isBasmala(trimmed)) {
      return {
        type: 'basmala',
        confidence: 'high',
        scores: {
          basmala: { score: 100, confidence: 'high', reasons: ['يطابق نمط البسملة'] }
        },
        context: this.buildEmptyContext(),
        doubtScore: 0,
        needsReview: false,
        top2Candidates: null
      };
    }

    // Scene Header Start -> scene-header-top-line (high)
    if (this.isSceneHeaderStart(trimmed)) {
      return {
        type: 'scene-header-top-line',
        confidence: 'high',
        scores: {
          'scene-header-top-line': { score: 100, confidence: 'high', reasons: ['يطابق نمط رأس المشهد'] }
        },
        context: this.buildEmptyContext(),
        doubtScore: 0,
        needsReview: false,
        top2Candidates: null
      };
    }

    // Scene Header 1 -> scene-header-1 (high)
    if (this.isSceneHeader1(trimmed)) {
      return {
        type: 'scene-header-1',
        confidence: 'high',
        scores: {
          'scene-header-1': { score: 100, confidence: 'high', reasons: ['يطابق نمط رأس المشهد الأول'] }
        },
        context: this.buildEmptyContext(),
        doubtScore: 0,
        needsReview: false,
        top2Candidates: null
      };
    }

    // Transition -> transition (high)
    if (this.isTransition(trimmed)) {
      return {
        type: 'transition',
        confidence: 'high',
        scores: {
          transition: { score: 100, confidence: 'high', reasons: ['يطابق نمط الانتقال'] }
        },
        context: this.buildEmptyContext(),
        doubtScore: 0,
        needsReview: false,
        top2Candidates: null
      };
    }

    // Parenthetical shape -> parenthetical (high)
    if (this.isParenShaped(trimmed)) {
      return {
        type: 'parenthetical',
        confidence: 'high',
        scores: {
          parenthetical: { score: 100, confidence: 'high', reasons: ['بين قوسين'] }
        },
        context: this.buildEmptyContext(),
        doubtScore: 0,
        needsReview: false,
        top2Candidates: null
      };
    }

    // لم يتم التعرف على نمط ثابت
    return null;
  }

  /**
   * بناء سياق فارغ للفحص السريع
   */
  private static buildEmptyContext(): LineContext {
    return {
      previousLines: [],
      nextLines: [],
      stats: {
        currentLineLength: 0,
        currentWordCount: 0,
        hasPunctuation: false
      }
    };
  }

  /**
   * التصنيف باستخدام نظام النقاط
   * دالة رئيسية تجمع بين جميع دوال التسجيل
   * @param line السطر الحالي
   * @param index فهرس السطر
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @param documentMemory ذاكرة المستند (اختياري)
   * @returns نتيجة التصنيف الكاملة
   */
  static classifyWithScoring(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[],
    documentMemory?: DocumentMemory
  ): ClassificationResult {
    const quickCheck = this.quickClassify(line);
    if (quickCheck) {
      return quickCheck;
    }

    const ctx = this.buildContext(line, index, allLines, previousTypes);
    const normalized = this.normalizeLine(line);

    // حساب معلومات بلوك الحوار
    const dialogueBlockInfo = previousTypes 
      ? this.getDialogueBlockInfo(previousTypes, index)
      : { isInDialogueBlock: false, blockStartType: null, distanceFromCharacter: -1 };

    // حساب النقاط لكل نوع مع تمرير معلومات البلوك و documentMemory
    const characterScore = this.scoreAsCharacter(line, normalized, ctx, documentMemory);
    const dialogueScore = this.scoreAsDialogue(line, normalized, ctx, documentMemory, dialogueBlockInfo);
    const actionScore = this.scoreAsAction(line, normalized, ctx, documentMemory, dialogueBlockInfo);
    const parentheticalScore = this.scoreAsParenthetical(line, normalized, ctx, dialogueBlockInfo);

    // تحسين إضافي: إذا كان السطر يبدأ بفعل حركي، اجعل نقطة الأكشن أعلى
    if (this.isActionVerbStart(normalized)) {
      actionScore.score += 30;
      actionScore.confidence = 'high';
      actionScore.reasons.push('يبدأ بفعل حركي قوي');
    }

    // === تعديل: استخدام prevNonBlankType بدلاً من prevType مباشرة ===
    const prevNonBlankType = previousTypes 
      ? this.getPrevNonBlankType(previousTypes, index) 
      : null;
    
    // تحسين حاسم: لا تسمح لبلوك الحوار بابتلاع أسطر الأكشن
    // مثال: (Character) ثم سطر يبدأ بـ (نرى/نسمع/ترفع/ينهض...) يجب أن يبقى Action.
    const looksLikeActionStart = this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized);
    
    if (prevNonBlankType === 'character' && looksLikeActionStart) {
      dialogueScore.score -= 55;
      dialogueScore.reasons.push('سطر حركة رغم أن السابق شخصية (سالب)');
      actionScore.score += 25;
      actionScore.reasons.push('سطر حركة بعد شخصية (ترجيح للأكشن)');
    }

    // تحسين إضافي: إذا كان السطر طويلاً ويحتوي على علامات ترقيم، رجح الأكشن
    if (line.length > 50 && this.hasSentencePunctuation(normalized)) {
      actionScore.score += 20;
      actionScore.reasons.push('سطر طويل مع علامات ترقيم (غالباً أكشن)');
    }

    // ملاحظة: تمت إزالة المكافأة المطلقة للشرطة - أصبحت مشروطة بالسياق في scoreAsAction

    // جمع النقاط في كائن واحد
    const scores: { [type: string]: ClassificationScore } = {
      character: characterScore,
      dialogue: dialogueScore,
      action: actionScore,
      parenthetical: parentheticalScore
    };

    // استخراج أعلى مرشحين
    const top2Candidates = this.extractTop2Candidates(scores);
    
    // حساب درجة الشك
    const { doubtScore, needsReview } = this.calculateDoubtScore(scores);
    
    // إيجاد النوع الأعلى نقاطاً
    let bestType = 'action';
    let bestScore = 0;

    for (const [type, score] of (Object.entries(scores) as [string, ClassificationScore][])) {
      if (score.score > bestScore) {
        bestScore = score.score;
        bestType = type;
      }
    }

    // === جديد: تطبيق fallback ذكي عند الشك ===
    let fallbackApplied: { originalType: string; fallbackType: string; reason: string } | undefined;
    
    if (needsReview && top2Candidates) {
      const prevNonBlankType = previousTypes 
        ? this.getPrevNonBlankType(previousTypes, index) 
        : null;
      const nextLine = index + 1 < allLines.length ? allLines[index + 1] : null;
      const fallback = this.applySmartFallback(
        top2Candidates, 
        ctx, 
        prevNonBlankType, 
        nextLine,
        line
      );
      
      if (fallback && fallback.type !== bestType) {
        fallbackApplied = {
          originalType: bestType,
          fallbackType: fallback.type,
          reason: fallback.reason
        };
        bestType = fallback.type;
      }
    }

    // === جديد: تحديث القاموس بعد تحديد النوع ===
    if (documentMemory && bestType === 'character') {
      const trimmed = line.trim();
      const endsWithColon = trimmed.endsWith(':') || trimmed.endsWith('：');
      const confidence = endsWithColon ? 'high' : 'medium';
      
      // استخراج اسم الشخصية
      const characterName = trimmed.replace(/[:：\s]+$/, '');
      documentMemory.addCharacter(characterName, confidence);
    }

    return {
      type: bestType,
      confidence: scores[bestType].confidence,
      scores,
      context: ctx,
      doubtScore,
      needsReview,
      top2Candidates,
      fallbackApplied
    };
  }

  /**
   * تصنيف نص كامل وإرجاع نتائج مفصلة مع معلومات الشك
   * @param text النص الكامل
   * @param useContext استخدام التصنيف السياقي
   * @returns مصفوفة من BatchClassificationResult
   */
  static classifyBatchDetailed(
    text: string,
    useContext: boolean = true
  ): BatchClassificationResult[] {
    const lines = text.split(/\r?\n/);
    const results: BatchClassificationResult[] = [];
    const previousTypes: (string | null)[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i] || "";
      
      // التعامل مع السطور الفارغة
      if (ScreenplayClassifier.isBlank(rawLine)) {
        results.push({ 
          text: rawLine, 
          type: 'blank',
          confidence: 'high',
          doubtScore: 0,
          needsReview: false
        });
        previousTypes.push('blank');
        continue;
      }

      if (useContext) {
        const result = ScreenplayClassifier.classifyWithScoring(
          rawLine,
          i,
          lines,
          previousTypes
        );

        results.push({
          text: rawLine,
          type: result.type,
          confidence: result.confidence,
          doubtScore: result.doubtScore || 0,
          needsReview: result.needsReview || false,
          top2Candidates: result.top2Candidates,
          fallbackApplied: result.fallbackApplied
        });
        
        previousTypes.push(result.type);
      } else {
        // Fallback للطريقة القديمة
        results.push({
          text: rawLine,
          type: 'action',
          confidence: 'medium',
          doubtScore: 0,
          needsReview: false
        });
        previousTypes.push('action');
      }
    }

    // تحويل blank إلى action في الإخراج
    return results.map(r => ({
      ...r,
      type: r.type === 'blank' ? 'action' : r.type
    }));
  }

  /**
   * استخراج السطور التي تحتاج مراجعة للعرض في الـ UI
   * @param results نتائج التصنيف
   * @returns مصفوفة من ReviewableLineUI
   */
  static getReviewableLines(results: BatchClassificationResult[]): ReviewableLineUI[] {
    return results
      .map((r, index) => ({ ...r, lineIndex: index }))
      .filter(r => r.needsReview)
      .map(r => ({
        lineIndex: r.lineIndex,
        text: r.text,
        currentType: r.type,
        suggestedTypes: r.top2Candidates 
          ? [
              {
                type: r.top2Candidates[0].type,
                score: r.top2Candidates[0].score,
                reasons: r.top2Candidates[0].reasons
              },
              {
                type: r.top2Candidates[1].type,
                score: r.top2Candidates[1].score,
                reasons: r.top2Candidates[1].reasons
              }
            ]
          : [],
        fallbackApplied: r.fallbackApplied
      }));
  }

  /**
   * الحصول على إحصائيات الشك للمستند
   * @param results نتائج التصنيف
   * @returns إحصائيات الشك
   */
  static getDoubtStatistics(results: BatchClassificationResult[]): {
    totalLines: number;
    needsReviewCount: number;
    needsReviewPercentage: number;
    topAmbiguousPairs: { pair: string; count: number }[];
  } {
    const needsReviewLines = results.filter(r => r.needsReview);
    
    // حساب أكثر الأزواج غموضاً
    const pairCounts = new Map<string, number>();
    
    for (const line of needsReviewLines) {
      if (line.top2Candidates) {
        const pair = [line.top2Candidates[0].type, line.top2Candidates[1].type]
          .sort()
          .join(' vs ');
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
    
    const topAmbiguousPairs = Array.from(pairCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, count]) => ({ pair, count }));

    const nonEmptyLines = results.filter(r => r.text.trim() !== '');

    return {
      totalLines: nonEmptyLines.length,
      needsReviewCount: needsReviewLines.length,
      needsReviewPercentage: Math.round(
        (needsReviewLines.length / Math.max(1, nonEmptyLines.length)) * 100
      ),
      topAmbiguousPairs
    };
  }

  // ============================================================================
  // دوال Viterbi/HMM
  // ============================================================================

  /**
   * تصنيف مجموعة من السطور باستخدام خوارزمية Viterbi للحصول على التسلسل الأمثل.
   */
  classifyWithViterbi(
    lines: string[],
    options: {
      emissionWeight?: number;
      transitionWeight?: number;
      updateMemory?: boolean;
    } = {}
  ): BatchClassificationResult[] {
    const {
      emissionWeight = 0.6,
      transitionWeight = 0.4,
      updateMemory = true
    } = options;

    let ViterbiDecoder: any;
    try {
      ViterbiDecoder = require('../classes/ViterbiDecoder').ViterbiDecoder;
    } catch {
      console.warn('ViterbiDecoder not available');
      return [];
    }

    if (updateMemory) {
      this.preProcessForCharacters(lines);
    }

    const viterbiResults = ViterbiDecoder.decode(
      lines,
      this.documentMemory,
      emissionWeight,
      transitionWeight
    );

    const results: BatchClassificationResult[] = [];
    for (const vr of viterbiResults) {
      if (updateMemory && vr.type === 'character') {
        const name = vr.text.replace(/[:：\s]+$/, '').trim();
        const confidence = vr.text.trim().endsWith(':') ? 'high' : 'medium';
        this.documentMemory.addCharacter(name, confidence);
      }

      const sortedEmissions = Object.entries(vr.emissionScores)
        .sort((a, b) => (b[1] as number) - (a[1] as number));
      const gap = sortedEmissions[0] && sortedEmissions[1]
        ? (sortedEmissions[0][1] as number) - (sortedEmissions[1][1] as number)
        : 100;
      const doubtScore = gap < 15 ? 80 
                        : gap < 25 ? 50 
                        : gap < 40 ? 30 
                        : 10;
      
      // الخطوة 7: تخفيض استدعاء AI لـ scene-header-3
      const VERB_RE = /(يدخل|يخرج|يقف|يجلس|ينظر|يتحرك|يقترب|يبتعد|يركض|يمشي|يتحدث|يصرخ|تدخل|تخرج|تقف|تجلس|تنظر|تتحرك|تقترب|تبتعد|تركض|تمشي|تتحدث|تصرخ)/;
      const skipAIForSceneHeader3 = vr.type === 'scene-header-3' && 
                                     vr.emissionScores['scene-header-3'] >= 70 && 
                                     !VERB_RE.test(vr.text);
      const needsReview = (doubtScore >= 60 || vr.viterbiOverride) && !skipAIForSceneHeader3;

      results.push({
        text: vr.text,
        type: vr.type === 'blank' ? 'action' : vr.type,
        confidence: vr.confidence,
        doubtScore,
        needsReview,
        top2Candidates: sortedEmissions.length >= 2 ? [
          {
            type: sortedEmissions[0][0],
            score: sortedEmissions[0][1],
            confidence: 'medium',
            reasons: []
          },
          {
            type: sortedEmissions[1][0],
            score: sortedEmissions[1][1],
            confidence: 'low',
            reasons: []
          }
        ] as [CandidateType, CandidateType] : null,
        viterbiOverride: vr.viterbiOverride ? {
          greedyChoice: vr.greedyChoice,
          viterbiChoice: vr.type,
          reason: vr.overrideReason || ''
        } : undefined,
        fallbackApplied: undefined
      });
    }

    return results;
  }

  /**
   * دالة للمقارنة بين تصنيف Greedy وتصنيف Viterbi لكل سطر.
   * تعيد قائمة تبين لكل سطر ما كان تصنيفه الجشع وما أصبح تصنيفه وفق Viterbi وأسباب الاختلاف.
   * تستخدم لأغراض التشخيص والتجربة.
   */
  compareGreedyVsViterbi(lines: string[]): {
    lineIndex: number;
    text: string;
    greedyType: string;
    viterbiType: string;
    agreement: boolean;
    viterbiReason?: string;
  }[] {
    // 1. تصنيف Greedy المعتاد
    const text = lines.join('\n');
    const greedyResults = ScreenplayClassifier.classifyBatch(text, false, this.documentMemory);

    // 2. تصنيف باستخدام Viterbi (دون تحديث الذاكرة أثناء المقارنة حتى لا تتأثر نتائج greedy)
    const viterbiResults = this.classifyWithViterbi(lines, { updateMemory: false });

    // 3. تجميع النتائج المقارنة
    const comparisons: {
      lineIndex: number;
      text: string;
      greedyType: string;
      viterbiType: string;
      agreement: boolean;
      viterbiReason?: string;
    }[] = [];

    for (let i = 0; i < lines.length; i++) {
      comparisons.push({
        lineIndex: i,
        text: lines[i],
        greedyType: greedyResults[i].type,
        viterbiType: viterbiResults[i].type,
        agreement: greedyResults[i].type === viterbiResults[i].type,
        viterbiReason: viterbiResults[i].viterbiOverride?.reason
      });
    }

    return comparisons;
  }
}

// ==================== الكلاسات المساعدة ====================

/**
 * @class DocumentMemory
 * @description ذاكرة المستند - تخزن المعلومات المتعلمة أثناء التصنيف
 * 
 * هذا الكلاس يحل مشكلة تصنيف أسماء الشخصيات التي تبدأ بـ "ي" أو "ت" كـ action خطأً
 * مثل: ياسين، يوسف، تامر، تيسير
 * 
 * يعمل الكلاس على تعلّم أسماء الشخصيات من المستند نفسه أثناء التصنيف
 * ثم يستخدمها لتحسين دقة التصنيف
 */
export class DocumentMemory {
  /** قاموس الشخصيات المؤكدة (اسم الشخصية -> عدد مرات الظهور) */
  private knownCharacters: Map<string, number> = new Map();
  
  /** قاموس الأماكن المؤكدة */
  private knownPlaces: Map<string, number> = new Map();

  /**
   * تنظيف اسم الشخصية للمقارنة
   * @param name اسم الشخصية الخام
   * @returns الاسم المُنظف
   */
  private normalizeCharacterName(name: string): string {
    return name
      .replace(/[:：\s]+$/, '')  // إزالة النقطتين والمسافات من النهاية
      .replace(/^[\s]+/, '')     // إزالة المسافات من البداية
      .trim();
  }

  /**
   * إضافة شخصية للقاموس
   * @param name اسم الشخصية
   * @param confidence مستوى الثقة (high = من سطر ينتهي بـ :)
   */
  addCharacter(name: string, confidence: 'high' | 'medium'): void {
    const normalized = this.normalizeCharacterName(name);
    if (!normalized || normalized.length < 2) return;
    
    const currentCount = this.knownCharacters.get(normalized) || 0;
    const increment = confidence === 'high' ? 2 : 1;
    this.knownCharacters.set(normalized, currentCount + increment);
  }

  /**
   * فحص إذا كان الاسم شخصية معروفة
   * @param name الاسم للفحص
   * @returns مستوى الثقة أو null
   */
  isKnownCharacter(name: string): { confidence: 'high' | 'medium' | 'low' } | null {
    const normalized = this.normalizeCharacterName(name);
    const count = this.knownCharacters.get(normalized);
    
    if (!count) return null;
    if (count >= 3) return { confidence: 'high' };
    if (count >= 1) return { confidence: 'medium' };
    return { confidence: 'low' };
  }

  /**
   * إضافة مكان للقاموس
   * @param place اسم المكان
   */
  addPlace(place: string): void {
    const normalized = place.trim();
    if (!normalized || normalized.length < 2) return;
    
    const currentCount = this.knownPlaces.get(normalized) || 0;
    this.knownPlaces.set(normalized, currentCount + 1);
  }

  /**
   * فحص إذا كان النص مكان معروف
   * @param text النص للفحص
   * @returns true إذا كان مكان معروف
   */
  isKnownPlace(text: string): boolean {
    return this.knownPlaces.has(text.trim());
  }

  /**
   * الحصول على جميع الشخصيات المعروفة
   * @returns قائمة بأسماء الشخصيات
   */
  getAllCharacters(): string[] {
    return Array.from(this.knownCharacters.keys());
  }

  /**
   * مسح الذاكرة
   */
  clear(): void {
    this.knownCharacters.clear();
    this.knownPlaces.clear();
  }
}

/**
 * سياق مبسط يمكن استخدامه عند حساب الانبعاثات
 */
interface EmissionContext {
  lineLength: number;
  wordCount: number;
  nextLine: string | null;
  prevLine: string | null;
}

/**
 * @class EmissionCalculator
 * @description مسؤول عن حساب احتمالية/درجة أن يكون كل سطر من كل نوع (Emission Scores).
 */
export class EmissionCalculator {

  /**
   * حساب درجات الانبعاث لكل الحالات لسطر معين.
   */
  static calculateEmissions(
    rawLine: string,
    index: number,
    allLines: string[],
    documentMemory?: DocumentMemory
  ): { [state in ViterbiState]: number } {

    const emissions = {} as { [state in ViterbiState]: number };

    // إذا كان السطر فارغًا، فإن الحالة الوحيدة المنطقية هي 'blank'
    if (ScreenplayClassifier.isBlank(rawLine)) {
      for (const state of ALL_STATES) {
        emissions[state] = state === 'blank' ? 100 : 0;
      }
      return emissions;
    }

    const trimmed = rawLine.trim();

    // === تصنيفات سريعة بثقة عالية ===

    // 1. البسملة
    if (ScreenplayClassifier.isBasmala(trimmed)) {
      this.setHighConfidence(emissions, 'basmala');
      return emissions;
    }

    // 2. بداية رأس المشهد
    if (ScreenplayClassifier.isSceneHeaderStart(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-top-line');
      return emissions;
    }

    // 3. مشهد-1 (مشهد + رقم فقط)
    if (ScreenplayClassifier.isSceneHeader1(trimmed)) {
      this.setHighConfidence(emissions, 'scene-header-1');
      return emissions;
    }

    // 4. جملة انتقال
    if (ScreenplayClassifier.isTransition(trimmed)) {
      this.setHighConfidence(emissions, 'transition');
      return emissions;
    }

    // 5. بين قوسين (ملاحظة إخراجية)
    if (ScreenplayClassifier.isParenShaped(trimmed)) {
      this.setHighConfidence(emissions, 'parenthetical');
      return emissions;
    }

    // === حساب درجات الانبعاث بناءً على خصائص النص ===

    const ctx = this.buildEmissionContext(rawLine, index, allLines);
    const normalized = ScreenplayClassifier.normalizeLine(rawLine);

    emissions['character'] = this.calculateCharacterEmission(rawLine, normalized, ctx, documentMemory);
    emissions['dialogue'] = this.calculateDialogueEmission(rawLine, normalized, ctx);
    emissions['action'] = this.calculateActionEmission(rawLine, normalized, ctx, documentMemory);
    emissions['parenthetical'] = this.calculateParentheticalEmission(rawLine, normalized, ctx);
    emissions['scene-header-2'] = this.calculateSceneHeader2Emission(rawLine, normalized);
    emissions['scene-header-3'] = this.calculateSceneHeader3Emission(rawLine, normalized);

    // الأنواع الأخرى نعطيها قيم افتراضية منخفضة
    emissions['basmala'] = emissions['basmala'] ?? 0;
    emissions['transition'] = emissions['transition'] ?? 5;
    emissions['scene-header-1'] = emissions['scene-header-1'] ?? 5;
    emissions['scene-header-top-line'] = emissions['scene-header-top-line'] ?? 5;
    emissions['blank'] = 0;

    return emissions;
  }

  /**
   * بناء سياق مبسط للسطر
   */
  private static buildEmissionContext(
    rawLine: string,
    index: number,
    allLines: string[]
  ): EmissionContext {
    return {
      lineLength: rawLine.length,
      wordCount: ScreenplayClassifier.wordCount(rawLine),
      nextLine: index < allLines.length - 1 ? allLines[index + 1] : null,
      prevLine: index > 0 ? allLines[index - 1] : null
    };
  }

  /**
   * دالة مساعدة لتعيين ثقة عالية لنوع واحد
   */
  private static setHighConfidence(emissions: { [state: string]: number }, state: ViterbiState): void {
    for (const s of ALL_STATES) {
      emissions[s] = s === state ? 100 : 0;
    }
  }

  /**
   * حساب درجة احتمال أن يكون السطر اسم شخصية (Character)
   */
  private static calculateCharacterEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext,
    documentMemory?: DocumentMemory
  ): number {
    let score = 30;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. إذا انتهى السطر بنقطتين ":" → مؤشر قوي أنه اسم شخصية
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score += 50;
    }

    // 2. طول السطر صغير
    if (wordCount <= 3) score += 20;
    else if (wordCount <= 5) score += 10;
    else if (wordCount > 7) score -= 30;

    // 3. اسم موجود مسبقاً في ذاكرة المستند
    if (documentMemory) {
      const name = trimmed.replace(/[:：\s]+$/, '');
      const known = documentMemory.isKnownCharacter(name);
      if (known?.confidence === 'high') score += 40;
      else if (known?.confidence === 'medium') score += 25;
    }

    // 4. يبدأ بفعل
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 35;
    }

    // 5. لا يحتوي علامات ترقيم نهائية
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر حوار (Dialogue)
   */
  private static calculateDialogueEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext
  ): number {
    let score = 25;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. طول مناسب للحوار
    if (wordCount >= 2 && wordCount <= 50) score += 20;

    // 2. يحتوي علامات ترقيم جملية
    if (ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 15;
    }

    // 3. يحتوي على ضمائر
    if (/أنا|إنت|أنت|إحنا|نحن|هو|هي/.test(normalized)) {
      score += 15;
    }

    // 4. وجود علامة استفهام
    if (/\?|؟/.test(normalized)) {
      score += 10;
    }

    // 5. يبدأ بفعل حركي
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score -= 20;
    }

    // 6. لا ينتهي بنقطتين
    if (!trimmed.endsWith(':') && !trimmed.endsWith('：')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر وصف حركة/مشهد (Action)
   */
  private static calculateActionEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext,
    documentMemory?: DocumentMemory
  ): number {
    let score = 35;

    const trimmed = rawLine.trim();
    const wordCount = ctx.wordCount;

    // 1. يبدأ بفعل حركي
    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      score += 40;
    }

    // 2. يطابق أنماط جمل الوصف
    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) {
      score += 30;
    }

    // 3. طول السطر أطول من 5 كلمات
    if (wordCount > 5) score += 15;

    // 4. يحتوي كلمات وصفية شائعة
    if (/بطيء|سريع|فجأة|ببطء|بسرعة|هدوء|صمت/.test(normalized)) {
      score += 10;
    }

    // 5. ينتهي بنقطتين
    if (trimmed.endsWith(':') || trimmed.endsWith('：')) {
      score -= 30;
    }

    // 6. إذا كانت الكلمة معروفة كشخصية
    if (documentMemory) {
      const name = trimmed.replace(/[:：\s]+$/, '');
      const known = documentMemory.isKnownCharacter(name);
      if (known) score -= 25;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر ملاحظة إخراجية (Parenthetical)
   */
  private static calculateParentheticalEmission(
    rawLine: string,
    normalized: string,
    ctx: EmissionContext
  ): number {
    let score = 10;

    const trimmed = rawLine.trim();

    // 1. يبدأ بقوس "("
    if (trimmed.startsWith('(')) {
      score += 40;
    }

    // 2. يحتوي على كلمات إخراجية شائعة
    const parentheticalWords = ['همساً', 'بصوت', 'مبتسماً', 'بحزن', 'بغضب', 'ساخراً'];
    if (parentheticalWords.some(w => normalized.includes(w))) {
      score += 30;
    }

    // 3. السطر قصير
    if (ctx.wordCount <= 4) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو الجزء الثاني من رأس المشهد (Scene Header 2)
   */
  private static calculateSceneHeader2Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    // 1. يحتوي على كلمة دالة على المكان
    if (/داخلي|خارجي|د\.|خ\./.test(normalized)) {
      score += 40;
    }

    // 2. يحتوي على كلمة زمن
    if (/ليل|نهار|صباح|مساء|فجر/.test(normalized)) {
      score += 35;
    }

    // 3. يحتوي على شرطة "-"
    if (/[-–—]/.test(normalized)) {
      score += 10;
    }

    // 4. قصير
    if (ScreenplayClassifier.wordCount(normalized) <= 5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * حساب درجة احتمال أن يكون السطر هو سطر المكان (Scene Header 3: المكان الكامل - أساسي أو فرعي)
   */
  private static calculateSceneHeader3Emission(
    rawLine: string,
    normalized: string
  ): number {
    let score = 5;

    const trimmed = rawLine.trim();
    const wordCount = ScreenplayClassifier.wordCount(normalized);

    // كاشف الأفعال (Verb Killer) - الخطوة 2
    const VERB_RE = /(يدخل|يخرج|يقف|يجلس|ينظر|يتحرك|يقترب|يبتعد|يركض|يمشي|يتحدث|يصرخ|تدخل|تخرج|تقف|تجلس|تنظر|تتحرك|تقترب|تبتعد|تركض|تمشي|تتحدث|تصرخ)/;
    if (VERB_RE.test(normalized)) {
      score -= 40;
    }

    // الخطوة 4: بادئات الأماكن (LOCATION_PREFIX_RE)
    const LOCATION_PREFIX_RE = /^(داخل|في|أمام|خلف|بجوار|على|تحت|فوق)\s+/;
    if (LOCATION_PREFIX_RE.test(normalized)) {
      score += 25;
    }

    // 1. إذا كان يطابق مكان معروف
    if (ScreenplayClassifier.KNOWN_PLACES_RE.test(normalized)) {
      score += 50;
    }

    // 2. قصير (اسم مكان عادة كلمة أو كلمتين)
    if (wordCount <= 4) score += 15;

    // 3. لا يحتوي علامات ترقيم نهائية
    if (!ScreenplayClassifier.hasSentencePunctuation(normalized)) {
      score += 10;
    }

    // 4. لا ينتهي بنقطتين
    if (!trimmed.endsWith(':') && !trimmed.endsWith('：')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

/**
 * @class SmartImportSystem
 * @description نظام الاستيراد الذكي - مسؤول عن الاتصال بنموذج Gemini للمراجعة النهائية للسيناريو
 */
export class SmartImportSystem {
  
  /**
   * يرسل السطور لنموذج Gemini للمراجعة النهائية
   * @param lines مصفوفة السطور اللي محتاجة مراجعة
   */
  async refineWithGemini(lines: {text: string, type: string}[]): Promise<{text: string, type: string}[]> {
    try {
      // إرسال طلب للباك إند
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview', 
          messages: [
            {
              role: 'user',
              content: `
                You are an expert Arabic Screenplay Formatter.
                Review this parsed screenplay content.
                
                RULES:
                1. 'scene-header-3' is the complete location line (main or sub-location) - e.g., "منزل عبد العزيز", "غرفة المعيشة", "أمام الباب".
                2. Fix 'action' lines that are actually 'character' names.
                3. Do NOT change the text content.
                
                INPUT JSON:
                ${JSON.stringify(lines.slice(0, 200))} 

                Return ONLY JSON array.
              `
            }
          ]
        })
      });

      if (!response.ok) return [];

      const data = await response.json();
      const content = data.content || data.message || "";
      const jsonStr = content.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);

    } catch (error) {
      console.error("Smart Import AI Check Failed:", error);
      return []; 
    }
  }
}

/**
 * نتيجة المراجعة من LLM
 */
interface ReviewResult {
  originalIndex: number;
  originalType: ViterbiState;
  suggestedType: ViterbiState;
  confidence: number;
  reason: string;
}

/**
 * إحصائيات الأداء
 */
export interface ReviewPerformanceStats {
  totalLines: number;
  reviewedLines: number;
  changedLines: number;
  totalTimeMs: number;
  averageTimePerLine: number;
  apiCalls: number;
}

/**
 * مراجع التصنيف باستخدام LLM
 * يأخذ نتائج التصنيف الأولية ويراجع الحالات المشكوك فيها
 */
export class ClassifierReviewer {
  private static readonly API_ENDPOINT = typeof window !== 'undefined' 
    ? '/api/ai/chat' 
    : 'http://localhost:5000/api/ai/chat';
  
  // النماذج المتاحة - يمكن تغييرها حسب الحاجة
  private static readonly AVAILABLE_MODELS = {
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-3-flash-preview': 'gemini-3-flash-preview',
  };
  
  // النموذج - يُقرأ من متغيرات البيئة أو يستخدم القيمة الافتراضية
  private static MODEL = (typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_GEMINI_MODEL 
    : process.env.GEMINI_MODEL) || 'gemini-1.5-flash';
  
  private static readonly DOUBT_THRESHOLD = 30; // مستوى الشك الذي يستدعي المراجعة
  
  /**
   * تغيير النموذج المستخدم
   */
  static setModel(model: keyof typeof ClassifierReviewer.AVAILABLE_MODELS) {
    this.MODEL = this.AVAILABLE_MODELS[model];
  }
  
  /**
   * الحصول على النموذج الحالي
   */
  static getModel(): string {
    return this.MODEL;
  }

  /**
   * مراجعة التصنيف باستخدام LLM
   */
  static async reviewClassification(
    lines: ClassifiedLine[],
    options: {
      reviewAll?: boolean; // مراجعة كل الأسطر أم فقط المشكوك فيها
      doubtThreshold?: number; // حد الشك (0-100)
      enablePerformanceTracking?: boolean;
    } = {}
  ): Promise<{
    reviewed: ClassifiedLine[];
    stats: ReviewPerformanceStats;
  }> {
    const startTime = performance.now();
    const {
      reviewAll = false,
      doubtThreshold = this.DOUBT_THRESHOLD,
      enablePerformanceTracking = true,
    } = options;

    // تحديد الأسطر التي تحتاج مراجعة
    const linesToReview = reviewAll
      ? lines
      : lines.filter((line) => {
          const doubt = (line as any).doubtScore || 0;
          
          // الخطوة 7: تخفيض استدعاء AI - تخطي scene-header-3 ذات الدرجة العالية
          if (line.type === 'scene-header-3') {
            const emissionScore = (line as any).emissionScore || 0;
            const VERB_RE = /(يدخل|يخرج|يقف|يجلس|ينظر|يتحرك|يقترب|يبتعد|يركض|يمشي|يتحدث|يصرخ|تدخل|تخرج|تقف|تجلس|تنظر|تتحرك|تقترب|تبتعد|تركض|تمشي|تتحدث|تصرخ)/;
            if (emissionScore >= 70 && !VERB_RE.test(line.text)) {
              return false; // تخطي المراجعة
            }
          }
          
          return doubt >= doubtThreshold;
        });

    if (linesToReview.length === 0) {
      return {
        reviewed: lines,
        stats: {
          totalLines: lines.length,
          reviewedLines: 0,
          changedLines: 0,
          totalTimeMs: 0,
          averageTimePerLine: 0,
          apiCalls: 0,
        },
      };
    }

    // تقسيم إلى دفعات (batch) لتقليل عدد الطلبات
    const batchSize = 20;
    const batches: ClassifiedLine[][] = [];
    for (let i = 0; i < linesToReview.length; i += batchSize) {
      batches.push(linesToReview.slice(i, i + batchSize));
    }

    let apiCalls = 0;
    let changedLines = 0;
    const reviewedMap = new Map<number, ClassifiedLine>();

    // معالجة كل دفعة
    for (const batch of batches) {
      try {
        const batchResults = await this.reviewBatch(batch, lines);
        apiCalls++;

        // تطبيق التغييرات
        for (const result of batchResults) {
          if (result.suggestedType !== result.originalType) {
            const originalLine = lines[result.originalIndex];
            reviewedMap.set(result.originalIndex, {
              ...originalLine,
              type: result.suggestedType,
              // حفظ معلومات المراجعة
              _reviewInfo: {
                originalType: result.originalType,
                confidence: result.confidence,
                reason: result.reason,
              },
            } as any);
            changedLines++;
          }
        }
      } catch (error) {
        console.error('خطأ في مراجعة الدفعة:', error);
      }
    }

    // دمج النتائج
    const reviewed = lines.map((line, index) => {
      return reviewedMap.get(index) || line;
    });

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;

    const stats: ReviewPerformanceStats = {
      totalLines: lines.length,
      reviewedLines: linesToReview.length,
      changedLines,
      totalTimeMs,
      averageTimePerLine: linesToReview.length > 0 ? totalTimeMs / linesToReview.length : 0,
      apiCalls,
    };

    if (enablePerformanceTracking) {
      console.log('📊 إحصائيات مراجعة التصنيف:', {
        ...stats,
        changeRate: `${((changedLines / linesToReview.length) * 100).toFixed(1)}%`,
      });
    }

    return { reviewed, stats };
  }

  /**
   * مراجعة دفعة من الأسطر
   */
  private static async reviewBatch(
    batch: ClassifiedLine[],
    allLines: ClassifiedLine[]
  ): Promise<ReviewResult[]> {
    // بناء السياق (3 أسطر قبل وبعد كل سطر)
    const contextWindow = 3;
    const batchWithContext = batch.map((line) => {
      const index = allLines.indexOf(line);
      const before = allLines.slice(Math.max(0, index - contextWindow), index);
      const after = allLines.slice(index + 1, index + 1 + contextWindow);

      return {
        index,
        line,
        before,
        after,
      };
    });

    const prompt = this.buildReviewPrompt(batchWithContext);

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: this.MODEL,
          temperature: 0.1, // نريد إجابات دقيقة وثابتة
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content || data.message || '';

      return this.parseReviewResponse(content, batch, allLines);
    } catch (error) {
      console.error('خطأ في استدعاء API:', error);
      return [];
    }
  }

  /**
   * بناء prompt للمراجعة - نسخة محسّنة وشاملة
   */
  private static buildReviewPrompt(
    batchWithContext: Array<{
      index: number;
      line: ClassifiedLine;
      before: ClassifiedLine[];
      after: ClassifiedLine[];
    }>
  ): string {
    return `أنت خبير متخصص في تصنيف نصوص السيناريو العربية باستخدام نظام تصنيف متقدم. مهمتك مراجعة التصنيف الأولي بدقة عالية وتصحيح أي أخطاء.

## 📋 أنواع التصنيف المتاحة (11 نوع):

### 1️⃣ رؤوس المشاهد (Scene Headers)
- **scene-header-top-line**: السطر الأول الكامل من رأس المشهد
  - مثال: "مشهد 1: منزل عبد العزيز نواف"
  - يحتوي على: رقم المشهد + وصف اختياري
  
- **scene-header-1**: رقم المشهد فقط (سطر منفصل)
  - مثال: "مشهد 1" أو "م. 5"
  - قصير جداً (2-3 كلمات)
  
- **scene-header-2**: وصف المكان/الزمن (داخلي/خارجي - ليل/نهار)
  - مثال: "داخلي - نهار" أو "خارجي - ليل"
  - يحتوي على كلمات: داخلي، خارجي، ليل، نهار، صباح، مساء
  
- **scene-header-3**: سطر المكان الكامل (أساسي أو فرعي)
  - مثال: "منزل عبد العزيز - غرفة المكتب" (سطر واحد) أو "الشارع الرئيسي" أو "غرفة النوم"
  - **مهم جداً**: إذا كان السطر يحتوي على شرطة (–) بعد اسم مكان، فالجزء بعد الشرطة هو **استكمال للمكان** وليس action
  - يبدأ عادة بكلمات: منزل، بيت، شارع، غرفة، مكتب، مطعم، مقهى، حديقة، مدرسة، جامعة، مستشفى، داخل، في، أمام

### 2️⃣ الشخصيات والحوار
- **character**: اسم الشخصية
  - مثال: "عبد العزيز:" أو "نواف" أو "صوت رجل:"
  - قصير (1-4 كلمات)
  - قد ينتهي بـ : أو بدونها
  - يأتي **قبل** dialogue مباشرة
  - لا يبدأ بفعل حركي
  
- **dialogue**: حوار الشخصية
  - مثال: "أين وضعت الملفات؟"
  - يأتي **بعد** character مباشرة
  - قد يكون سؤال أو جملة عادية
  - لا يبدأ عادة بفعل حركي (إلا في حالات نادرة)
  
- **parenthetical**: ملاحظة إخراجية (بين قوسين)
  - مثال: "(بصوت منخفض)" أو "(يبتسم)"
  - **دائماً** بين قوسين
  - يأتي بين character و dialogue أو داخل dialogue

### 3️⃣ الوصف والحركة
- **action**: وصف الحركة/المشهد
  - مثال: "يدخل عبد العزيز إلى الغرفة ببطء."
  - يبدأ عادة بفعل حركي: يدخل، يخرج، ينظر، يجلس، تقف، يمشي
  - أو وصف المشهد: "الغرفة مظلمة والستائر مغلقة"
  - **ليس** اسم مكان (إذا كان اسم مكان → scene-header-3)

### 4️⃣ أخرى
- **transition**: انتقال مشهدي
  - مثال: "قطع إلى" أو "يتلاشى" أو "CUT TO:"
  - قصير جداً (1-3 كلمات)
  - كلمات محددة: قطع، مزج، ذوبان، يتلاشى
  
- **blank**: سطر فارغ
  - لا يحتوي على أي نص
  - يستخدم للفصل بين العناصر

## 🎯 قواعد التصنيف الذكية:

### قاعدة 1: التسلسل المنطقي
- scene-header-top-line → (blank) → scene-header-2 → (blank) → scene-header-3 → (blank) → action
- أو: scene-header-1 → scene-header-2 → scene-header-3 → action
- character → dialogue (أو parenthetical → dialogue)
- action → action (يمكن تكرار action)

### قاعدة 2: الشرطة في أسماء الأماكن ⚠️
**مهم جداً**: إذا رأيت سطراً مثل:
- "منزل عبد العزيز – غرفة المكتب"
- "الشارع الرئيسي - أمام المحل"
- "المدرسة – الفصل الأول"

هذا **scene-header-3** وليس action! الجزء بعد الشرطة هو تفصيل للمكان.

### قاعدة 3: الأفعال الحركية
إذا بدأ السطر بفعل حركي (يدخل، يخرج، ينظر، يجلس، تقف...):
- إذا كان بعد character → قد يكون parenthetical (إذا بين قوسين) أو action
- إذا لم يكن بعد character → action

### قاعدة 4: السياق
- إذا كان السطر بعد scene-header-2 وقصير ويحتوي على اسم مكان → scene-header-3
- إذا كان السطر قصير (1-3 كلمات) ولا يحتوي على فعل → قد يكون character أو scene-header-3
- إذا كان السطر بعد character مباشرة → dialogue (إلا إذا كان بين قوسين → parenthetical)

### قاعدة 5: علامات الترقيم
- character: قد ينتهي بـ : أو بدونها
- dialogue: قد ينتهي بـ . أو ؟ أو ! أو بدون علامة
- action: عادة ينتهي بـ .
- scene-header-3: **لا** ينتهي بعلامة ترقيم


## 📊 الأسطر المطلوب مراجعتها:

${batchWithContext
  .map(
    ({ index, line, before, after }) => {
      // تحليل السطر
      const wordCount = line.text.trim().split(/\s+/).length;
      const hasDash = /[-–—]/.test(line.text);
      const hasColon = /[:：]/.test(line.text);
      const hasParentheses = /[\(\)]/.test(line.text);
      const startsWithVerb = /^(يدخل|يخرج|ينظر|يرفع|تبتسم|ترقد|تقف|يبسم|يضع|يقول|تنظر|تربت|تقوم|يشق|تشق|تضرب|يسحب|يلتفت|يقف|يجلس|تجلس|يجري|تجري|يمشي|تمشي)/.test(line.text.trim());
      const hasPlaceWord = /(منزل|بيت|شارع|غرفة|مكتب|مطعم|مقهى|حديقة|مدرسة|جامعة|مستشفى|محل|شقة|قاعة|ممر|سطح|ساحة)/.test(line.text);
      
      // تحليل السياق
      const prevType = before.length > 0 ? before[before.length - 1].type : 'none';
      const nextType = after.length > 0 ? after[0].type : 'none';
      
      return `
### 📝 السطر #${index}
**التصنيف الحالي:** ${line.type}
**النص:** "${line.text}"
**التحليل السريع:**
  • عدد الكلمات: ${wordCount}
  • يحتوي على شرطة: ${hasDash ? 'نعم ⚠️' : 'لا'}
  • يحتوي على نقطتين: ${hasColon ? 'نعم' : 'لا'}
  • يحتوي على أقواس: ${hasParentheses ? 'نعم' : 'لا'}
  • يبدأ بفعل حركي: ${startsWithVerb ? 'نعم' : 'لا'}
  • يحتوي على كلمة مكان: ${hasPlaceWord ? 'نعم ⚠️' : 'لا'}

**السياق:**
  • النوع السابق: ${prevType}
  • النوع اللاحق: ${nextType}

**الأسطر السابقة:**
${before.map((l, i) => `  ${i + 1}. [${l.type}] "${l.text}"`).join('\n') || '  (بداية المستند)'}

**الأسطر اللاحقة:**
${after.map((l, i) => `  ${i + 1}. [${l.type}] "${l.text}"`).join('\n') || '  (نهاية المستند)'}
`;
    }
  )
  .join('\n' + '='.repeat(60) + '\n')}

## المطلوب:
أرجع JSON فقط بهذا الشكل (بدون أي نص إضافي):
\`\`\`json
[
  {
    "index": رقم_السطر,
    "suggestedType": "النوع_المقترح",
    "confidence": نسبة_الثقة_من_0_إلى_100,
    "reason": "سبب_التغيير_أو_keep_if_correct"
  }
]
\`\`\`

**ملاحظة:** إذا كان التصنيف الحالي صحيح، ضع نفس النوع في suggestedType.`;
  }

  /**
   * تحليل استجابة LLM
   */
  private static parseReviewResponse(
    content: string,
    batch: ClassifiedLine[],
    allLines: ClassifiedLine[]
  ): ReviewResult[] {
    try {
      // استخراج JSON من الاستجابة
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error('الاستجابة ليست مصفوفة');
      }

      return parsed
        .map((item: any) => {
          const originalLine = allLines[item.index];
          if (!originalLine) return null;

          return {
            originalIndex: item.index,
            originalType: originalLine.type,
            suggestedType: item.suggestedType as ViterbiState,
            confidence: item.confidence || 50,
            reason: item.reason || 'no reason provided',
          };
        })
        .filter((r): r is ReviewResult => r !== null);
    } catch (error) {
      console.error('خطأ في تحليل استجابة LLM:', error);
      console.log('المحتوى المستلم:', content);
      return [];
    }
  }

  /**
   * حساب درجة الشك بناءً على السطر والسياق
   */
  static calculateDoubtScore(
    line: ClassifiedLine,
    context: {
      prevLine?: ClassifiedLine;
      nextLine?: ClassifiedLine;
      emissions?: { [state in ViterbiState]?: number };
    }
  ): number {
    let doubtScore = 0;
    
    // 1. فحص الانبعاثات إذا كانت متاحة
    if (context.emissions) {
      const sortedEmissions = Object.entries(context.emissions)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0));
      
      if (sortedEmissions.length >= 2) {
        const diff = (sortedEmissions[0][1] || 0) - (sortedEmissions[1][1] || 0);
        if (diff < 0.15) doubtScore += 40;
        else if (diff < 0.25) doubtScore += 25;
      }
    }
    
    // 2. فحص السياق
    if (context.prevLine && context.nextLine) {
      const isInDialogue = context.prevLine.type === 'character' && context.nextLine.type === 'dialogue';
      if (isInDialogue && line.type !== 'parenthetical' && line.type !== 'dialogue') {
        doubtScore += 30;
      }
    }
    
    // 3. فحص طول النص
    const wordCount = line.text.trim().split(/\s+/).length;
    if (wordCount <= 2) doubtScore += 20;
    
    return Math.min(doubtScore, 100);
  }

  /**
   * الخيار 2: حساب doubtScore هجين (قواعد + AI)
   */
  static async calculateDoubtScoreHybrid(
    line: ClassifiedLine,
    context: {
      prevLine?: ClassifiedLine;
      nextLine?: ClassifiedLine;
      emissions?: { [state in ViterbiState]?: number };
    }
  ): Promise<number> {
    // 1. حساب الشك بالقواعد فقط (AI معطل مؤقتاً لتجنب أخطاء 502)
    const ruleBasedDoubt = this.calculateDoubtScore(line, context);

    // TODO: إعادة تفعيل AI doubt calculation بعد حل مشكلة 502
    // if (ruleBasedDoubt >= 20 && ruleBasedDoubt <= 60) {
    //   try {
    //     const aiDoubt = await this.calculateDoubtScoreWithAI(line, context);
    //     return Math.round(ruleBasedDoubt * 0.4 + aiDoubt * 0.6);
    //   } catch (error) {
    //     console.error('خطأ في حساب AI doubt:', error);
    //     return ruleBasedDoubt;
    //   }
    // }

    return ruleBasedDoubt;
  }
}

// ==================== Helper Functions ====================

const postProcessFormatting = (
  htmlResult: string,
  getFormatStylesFn: (type: string) => React.CSSProperties
): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlResult;
  let elements = Array.from(tempDiv.children);

  // 1. Bullet Character Processing
  for (let i = 0; i < elements.length; i++) {
    const currentElement = elements[i] as HTMLElement;
    const nextElement = elements[i + 1] as HTMLElement | undefined;

    if (currentElement.className === "action" || currentElement.className === "character") {
      const textContent = currentElement.textContent || "";
      const bulletCharacterPattern = ScreenplayClassifier.BULLET_CHARACTER_RE;
      const match = textContent.match(bulletCharacterPattern);

      if (match) {
        const characterName = (match[1] || "").trim();
        const dialogueText = (match[2] || "").trim();

        if (!characterName) {
          continue;
        }

        currentElement.className = "character";
        currentElement.textContent = characterName + ":";
        Object.assign(currentElement.style, getFormatStylesFn("character"));

        const dialogueElement = document.createElement("div");
        dialogueElement.className = "dialogue";
        dialogueElement.textContent = dialogueText;
        Object.assign(dialogueElement.style, getFormatStylesFn("dialogue"));

        if (nextElement) {
          tempDiv.insertBefore(dialogueElement, nextElement);
        } else {
          tempDiv.appendChild(dialogueElement);
        }
      }
    }
  }

  // 2. Spacing Processing
  const isBlankActionElement = (el: HTMLElement): boolean => {
    const text = (el.textContent || "").trim();
    if (text !== "") return false;
    return el.className === "action" || el.className === "dialogue" || el.className === "Dialogue";
  };

  const createBlankActionElement = (): HTMLDivElement => {
    const blank = document.createElement("div");
    blank.className = "action";
    blank.textContent = "";
    Object.assign(blank.style, getFormatStylesFn("action"));
    return blank;
  };

  const spacingOutput = document.createElement("div");
  // تحديث قائمة العناصر بعد التعديلات السابقة
  elements = Array.from(tempDiv.children);
  const children = elements as HTMLElement[];
  let prevNonBlankType: string | null = null;
  let pendingBlanks: HTMLElement[] = [];

  const flushBlanks = () => {
    for (const b of pendingBlanks) {
      spacingOutput.appendChild(b);
    }
    pendingBlanks = [];
  };

  for (const child of children) {
    if (isBlankActionElement(child)) {
      pendingBlanks.push(child);
      continue;
    }

    if (!prevNonBlankType) {
      flushBlanks();
      spacingOutput.appendChild(child);
      prevNonBlankType = child.className;
      continue;
    }

    if (
      (prevNonBlankType === 'character' || prevNonBlankType === 'Character') &&
      (child.className === 'dialogue' || child.className === 'Dialogue')
    ) {
      pendingBlanks = [];
    } else {
      const spacingRule = ScreenplayClassifier.getEnterSpacingRule(
        prevNonBlankType,
        child.className
      );

      if (spacingRule === true) {
        if (pendingBlanks.length > 0) {
          spacingOutput.appendChild(pendingBlanks[0]);
        } else {
          spacingOutput.appendChild(createBlankActionElement());
        }
        pendingBlanks = [];
      } else if (spacingRule === false) {
        pendingBlanks = [];
      } else {
        flushBlanks();
      }
    }

    spacingOutput.appendChild(child);
    prevNonBlankType = child.className;
  }

  flushBlanks();

  tempDiv.innerHTML = "";
  while (spacingOutput.firstChild) {
    tempDiv.appendChild(spacingOutput.firstChild);
  }

  return tempDiv.innerHTML;
};

// ==================== Handle Paste ====================

/**
 * @function handlePaste
 * @description معالج اللصق - يقوم بتصنيف النص المُلصق باستخدام classifyBatchWithAIReview (نظام المراجعة الذكي)
 * @param e - حدث اللصق
 * @param editorRef - مرجع للمحرر
 * @param getFormatStylesFn - دالة للحصول على الـ styles
 * @param updateContentFn - دالة لتحديث المحتوى
 */
export const handlePaste = async (
  e: React.ClipboardEvent,
  editorRef: React.RefObject<HTMLDivElement | null>,
  getFormatStylesFn: (formatType: string) => React.CSSProperties,
  updateContentFn: () => void
) => {
  const handlePasteLocal = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    try {
      const clipboardData = e.clipboardData;
      const pastedText = clipboardData.getData("text/plain");

      if (editorRef.current) {
        const classifiedElements = await ScreenplayClassifier.classifyBatchWithAIReview(
          pastedText,
          true,
          undefined,
          20
        );

        let htmlResult = "";

        for (const element of classifiedElements) {
          const { text, type } = element;
          const styles = getFormatStylesFn(type);
          const styleString = cssObjectToString(styles);

          if (type === "scene-header-top-line") {
            const sceneHeaderParts = ScreenplayClassifier.parseSceneHeaderFromLine(text);
            
            if (sceneHeaderParts) {
              const container = document.createElement("div");
              container.className = "scene-header-top-line";
              Object.assign(container.style, styles);

              const part1 = document.createElement("span");
              part1.className = "scene-header-1";
              part1.textContent = sceneHeaderParts.sceneNum;
              Object.assign(part1.style, getFormatStylesFn("scene-header-1"));
              container.appendChild(part1);

              if (sceneHeaderParts.timeLocation) {
                const part2 = document.createElement("span");
                part2.className = "scene-header-2";
                part2.textContent = sceneHeaderParts.timeLocation;
                Object.assign(part2.style, getFormatStylesFn("scene-header-2"));
                container.appendChild(part2);
              }

              htmlResult += container.outerHTML;
            } else {
              const parts = text.split(/\s+/).filter(Boolean);
              const sceneNum = parts[0] || "";
              const timeLocation = parts.slice(1).join(" ");

              const container = document.createElement("div");
              container.className = "scene-header-top-line";
              Object.assign(container.style, styles);

              const part1 = document.createElement("span");
              part1.className = "scene-header-1";
              part1.textContent = sceneNum;
              Object.assign(part1.style, getFormatStylesFn("scene-header-1"));
              container.appendChild(part1);

              if (timeLocation) {
                const part2 = document.createElement("span");
                part2.className = "scene-header-2";
                part2.textContent = timeLocation;
                Object.assign(part2.style, getFormatStylesFn("scene-header-2"));
                container.appendChild(part2);
              }

              htmlResult += container.outerHTML;
            }
          } else {
            htmlResult += `<div class="${type}" style='${styleString}'>${text}</div>`;
          }
        }

        const correctedHtmlResult = postProcessFormatting(htmlResult, getFormatStylesFn);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = sanitizeHtml(correctedHtmlResult);

        const elements = tempDiv.querySelectorAll<HTMLElement>("div, span");
        elements.forEach((element) => {
          const className = element.className;
          if (className) {
            Object.assign(element.style, getFormatStylesFn(className));
          }
        });

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }

          range.insertNode(fragment);
          updateContentFn();
        }
      }
    } catch (error) {
      console.error('فشلت عملية اللصق:', error);
      alert('فشلت عملية اللصق. يرجى المحاولة مرة أخرى.');
    }
  };

  handlePasteLocal(e);
};

// ==================== SmartFormatter Class ====================

/**
 * @class SmartFormatter
 * @description محرك التنسيق الذكي المستقل - ينفذ المنطق الهجين (Hybrid Logic + AI) بمعزل تام عن عملية اللصق
 */
export class SmartFormatter {
  
  /**
   * دالة مستقلة تماماً تقوم بقراءة المحرر وإعادة تنسيقه بذكاء
   * @param editorElement عنصر الـ DOM الخاص بالمحرر
   * @param onUpdate دالة callback لتحديث الـ State بعد الانتهاء
   */
  static async runFullFormat(
    editorElement: HTMLDivElement, 
    onUpdate: () => void
  ) {
    if (!editorElement) return;

    // 1. استخراج النص الحالي من المحرر
    const fullText = editorElement.innerText || "";
    
    // 2. تشغيل التصنيف الهجين (محتوى + سياق) محلياً
    let classifiedLines = ScreenplayClassifier.classifyBatch(fullText, true);

    // 3. (اختياري) تشغيل الـ AI للمراجعة
    const aiSystem = new SmartImportSystem();
    console.log("Starting AI formatting refinement...");
    
    const refinedLines = await aiSystem.refineWithGemini(classifiedLines);
    
    // لو الـ AI رجع نتيجة، نستخدمها. لو فشل، نستخدم النتيجة المحلية
    if (refinedLines && refinedLines.length > 0) {
      classifiedLines = refinedLines;
      console.log("Applied AI formatting.");
    }

    classifiedLines = ScreenplayClassifier.applyEnterSpacingRules(classifiedLines);

    // ========================================================================
    // FIX: فلتر الأمان القسري - حذف أي سطر فارغ بين الشخصية والحوار
    // ========================================================================
    classifiedLines = classifiedLines.filter((line, index, arr) => {
      // لا تحذف أول أو آخر سطر
      if (index === 0 || index === arr.length - 1) return true;

      const prev = arr[index - 1];
      const next = arr[index + 1];

      // هل هذا السطر "فراغ"؟ (Action أو Dialogue فارغ)
      const isBlank = !line.text.trim();

      // هل قبله شخصية وبعده حوار؟
      const isCharacterPrev = prev.type.toLowerCase() === 'character';
      const isDialogueNext = next.type.toLowerCase() === 'dialogue';

      // إذا تحققت الشروط الثلاثة، احذف السطر فوراً
      if (isBlank && isCharacterPrev && isDialogueNext) {
        return false;
      }
      return true;
    });
    // ========================================================================

    // 4. إعادة بناء الـ HTML للمحرر
    let newHTML = '';
    classifiedLines.forEach(line => {
      if (line.type === 'scene-header-top-line') {
        const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(line.text);
        if (parsed) {
          const container = document.createElement('div');
          container.className = 'scene-header-top-line';
          Object.assign(container.style, getFormatStyles('scene-header-top-line'));

          const part1 = document.createElement('span');
          part1.className = 'scene-header-1';
          part1.textContent = parsed.sceneNum;
          Object.assign(part1.style, getFormatStyles('scene-header-1'));
          container.appendChild(part1);

          if (parsed.timeLocation) {
            const part2 = document.createElement('span');
            part2.className = 'scene-header-2';
            part2.textContent = parsed.timeLocation;
            Object.assign(part2.style, getFormatStyles('scene-header-2'));
            container.appendChild(part2);
          }

          newHTML += container.outerHTML;
          return;
        }
      }

      const div = document.createElement('div');
      div.className = line.type;
      div.textContent = line.text;
      Object.assign(div.style, getFormatStyles(line.type));
      newHTML += div.outerHTML;
    });

    // 5. تطبيق التغييرات
    editorElement.innerHTML = newHTML;
    
    // تحديث المحرر
    onUpdate();
  }
}

// ==================== Handlers (من handlers/index.ts) ====================

/**
 * @function createHandleAIReview
 * @description معالج مراجعة AI للمحتوى
 */
export const createHandleAIReview = (
  editorRef: React.RefObject<HTMLDivElement | null>,
  setIsReviewing: (reviewing: boolean) => void,
  setReviewResult: (result: string) => void
) => {
  return async () => {
    if (!editorRef.current) return;

    setIsReviewing(true);
    const content = editorRef.current.innerText;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash",
          messages: [
            {
              role: "user",
              content: `You are an expert Arabic Screenplay Formatter.

Analyze the following screenplay text and return a concise formatting review.

FOCUS ONLY ON FORMATTING:
- Scene headers (scene-header-1/2/3 correctness)
- Character vs dialogue separation
- Parentheticals and transitions
- Any lines misclassified as action

Return plain text in Arabic.

TEXT:
${(content || "").slice(0, 12000)}
`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(`API error: ${response.status}${details ? ` - ${details}` : ""}`);
      }

      const data = await response.json();
      const result =
        typeof data?.content === "string"
          ? data.content
          : JSON.stringify(data, null, 2);

      setReviewResult(result);
    } catch (error) {
      setReviewResult(
        `AI review failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsReviewing(false);
    }
  };
};

// ==================== Character Rename Handler ====================

/**
 * @function createHandleCharacterRename
 * @description معالج إعادة تسمية الشخصيات
 */
export const createHandleCharacterRename = (
  oldCharacterName: string,
  newCharacterName: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  updateContent: () => void,
  setShowCharacterRename: (show: boolean) => void,
  setOldCharacterName: (name: string) => void,
  setNewCharacterName: (name: string) => void
) => {
  return () => {
    if (
      !oldCharacterName.trim() ||
      !newCharacterName.trim() ||
      !editorRef.current
    )
      return;

    const regex = new RegExp(`^\\s*${oldCharacterName}\\s*$`, "gmi");

    if (editorRef.current) {
      const replacementsApplied = applyRegexReplacementToTextNodes(
        editorRef.current,
        regex.source,
        regex.flags,
        newCharacterName.toUpperCase(),
        true,
      );

      if (replacementsApplied > 0) {
        updateContent();
        alert(
          `تم إعادة تسمية الشخصية "${oldCharacterName}" إلى "${newCharacterName}" (${replacementsApplied} حالة)`,
        );
        setShowCharacterRename(false);
        setOldCharacterName("");
        setNewCharacterName("");
      } else {
        alert(
          `لم يتم العثور على الشخصية "${oldCharacterName}" لإعادة تسميتها.`,
        );
        setShowCharacterRename(false);
      }
    }
  };
};

// ==================== KeyDown Handler ====================

/**
 * @function createHandleKeyDown
 * @description معالج أحداث لوحة المفاتيح - Tab, Enter, Ctrl shortcuts
 */
export const createHandleKeyDown = (
  currentFormat: string,
  getNextFormatOnTab: (format: string, shiftKey: boolean) => string,
  getNextFormatOnEnter: (format: string) => string,
  applyFormatToCurrentLine: (format: string, isEnterAction?: boolean) => void,
  formatText: (command: string, value?: string) => void,
  setShowSearchDialog: (show: boolean) => void,
  setShowReplaceDialog: (show: boolean) => void,
  updateContent: () => void
) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const nextFormat = getNextFormatOnTab(currentFormat, e.shiftKey);
      applyFormatToCurrentLine(nextFormat, false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextFormat = getNextFormatOnEnter(currentFormat);
      applyFormatToCurrentLine(nextFormat, true);
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
        case "B":
          e.preventDefault();
          formatText("bold");
          break;
        case "i":
        case "I":
          e.preventDefault();
          formatText("italic");
          break;
        case "u":
        case "U":
          e.preventDefault();
          formatText("underline");
          break;
        case "1":
          e.preventDefault();
          applyFormatToCurrentLine("scene-header-top-line");
          break;
        case "2":
          e.preventDefault();
          applyFormatToCurrentLine("character");
          break;
        case "3":
          e.preventDefault();
          applyFormatToCurrentLine("dialogue");
          break;
        case "4":
          e.preventDefault();
          applyFormatToCurrentLine("action");
          break;
        case "6":
          e.preventDefault();
          applyFormatToCurrentLine("transition");
          break;
        case "f":
        case "F":
          e.preventDefault();
          setShowSearchDialog(true);
          break;
        case "h":
        case "H":
          e.preventDefault();
          setShowReplaceDialog(true);
          break;
      }
    }

    setTimeout(updateContent, 10);
  };
};

// ==================== Replace Handler ====================

/**
 * @function createHandleReplace
 * @description معالج الاستبدال في المحتوى
 */
export const createHandleReplace = (
  searchTerm: string,
  replaceTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  updateContent: () => void,
  setShowReplaceDialog: (show: boolean) => void,
  setSearchTerm: (term: string) => void,
  setReplaceTerm: (term: string) => void
) => {
  return async () => {
    if (!searchTerm.trim() || !editorRef.current) return;

    const content = editorRef.current.innerText;
    const result = await searchEngine.current.replaceInContent(
      content,
      searchTerm,
      replaceTerm,
    );

    if (result.success && editorRef.current) {
      const replacementsApplied = applyRegexReplacementToTextNodes(
        editorRef.current,
        result.patternSource as string,
        result.patternFlags as string,
        result.replaceText as string,
        result.replaceAll !== false,
      );

      if (replacementsApplied > 0) {
        updateContent();
      }

      alert(
        `تم استبدال ${replacementsApplied} حالة من "${searchTerm}" بـ "${replaceTerm}"`,
      );
      setShowReplaceDialog(false);
      setSearchTerm("");
      setReplaceTerm("");
    } else {
      alert(`فشل الاستبدال: ${result.error}`);
    }
  };
};

// ==================== Search Handler ====================

/**
 * @function createHandleSearch
 * @description معالج البحث في المحتوى
 */
export const createHandleSearch = (
  searchTerm: string,
  editorRef: React.RefObject<HTMLDivElement | null>,
  searchEngine: React.MutableRefObject<AdvancedSearchEngine>,
  setShowSearchDialog: (show: boolean) => void
) => {
  return async () => {
    if (!searchTerm.trim() || !editorRef.current) return;

    const content = editorRef.current.innerText;
    const result = await searchEngine.current.searchInContent(
      content,
      searchTerm,
    );

    if (result.success) {
      alert(`تم العثور على ${result.totalMatches} نتيجة لـ "${searchTerm}"`);
      setShowSearchDialog(false);
    } else {
      alert(`فشل البحث: ${result.error}`);
    }
  };
};

// ==================== SceneHeaderAgent ====================

/**
 * @function SceneHeaderAgent
 * @description معالج رؤوس المشاهد - يحلل سطر النص ويحدد إذا كان رأس مشهد ويقوم بتنسيقه
 * @param line - السطر المراد معالجته
 * @param ctx - السياق (هل نحن في حوار أم لا)
 * @param getFormatStylesFn - دالة للحصول على الـ styles حسب النوع
 * @returns HTML للرأس المنسق أو null إذا لم يكن رأس مشهد
 */
export const SceneHeaderAgent = (
  line: string,
  ctx: { inDialogue: boolean },
  getFormatStylesFn: (formatType: string) => React.CSSProperties
) => {
  const classifier = new ScreenplayClassifier();
  const Patterns = classifier.Patterns;
  const trimmedLine = line.trim();

  const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(trimmedLine);
  if (parsed) {
    const container = document.createElement("div");
    container.className = "scene-header-top-line";
    Object.assign(container.style, getFormatStylesFn("scene-header-top-line"));

    const part1 = document.createElement("span");
    part1.className = "scene-header-1";
    part1.textContent = parsed.sceneNum;
    Object.assign(part1.style, getFormatStylesFn("scene-header-1"));
    container.appendChild(part1);

    if (parsed.timeLocation) {
      const part2 = document.createElement("span");
      part2.className = "scene-header-2";
      part2.textContent = parsed.timeLocation;
      Object.assign(part2.style, getFormatStylesFn("scene-header-2"));
      container.appendChild(part2);
    }

    let html = container.outerHTML;

    if (parsed.placeInline) {
      const placeDiv = document.createElement("div");
      placeDiv.className = "scene-header-3";
      placeDiv.textContent = parsed.placeInline;
      Object.assign(placeDiv.style, getFormatStylesFn("scene-header-3"));
      html += placeDiv.outerHTML;
    }

    ctx.inDialogue = false;
    return { html, processed: true };
  }

  const normalized = ScreenplayClassifier.normalizeLine(trimmedLine);
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
  const hasDash = /[-–—]/.test(normalized);
  const hasColon = normalized.includes(":") || normalized.includes("：");
  const hasSentencePunctuation = /[\.!؟\?]/.test(normalized);

  // الخطوة 3: عكس منطق الشرطة - الشرطة بعد مكان = تعزيز (إلا لو فيه فعل)
  const VERB_RE = /(يدخل|يخرج|يقف|يجلس|ينظر|يتحرك|يقترب|يبتعد|يركض|يمشي|يتحدث|يصرخ|تدخل|تخرج|تقف|تجلس|تنظر|تتحرك|تقترب|تبتعد|تركض|تمشي|تتحدث|تصرخ)/;
  const hasVerbAfterDash = hasDash && VERB_RE.test(normalized.split(/[-–—]/)[1] || '');
  
  if (
    Patterns.sceneHeader3.test(trimmedLine) &&
    wordCount <= 6 &&
    (!hasDash || !hasVerbAfterDash) &&
    !hasColon &&
    !hasSentencePunctuation
  ) {
    const element = document.createElement("div");
    element.className = "scene-header-3";
    element.textContent = trimmedLine;
    Object.assign(element.style, getFormatStylesFn("scene-header-3"));
    ctx.inDialogue = false;
    return { html: element.outerHTML, processed: true };
  }

  return null;
};
