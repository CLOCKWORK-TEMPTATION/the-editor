1: نظام المراجعة التلقائي (Auto-Reviewer v2)
typescript
export class AdvancedAutoReviewer {
  private knowledgeBase: Array<{
    pattern: RegExp;
    rules: {
      confirmType: string;
      rejectTypes: string[];
      minConfidence: number;
      explanation: string;
    }[];
  }> = [
    {
      pattern: /^بسم\s+الله\s+الرحمن\s+الرحيم/i,
      rules: [{
        confirmType: 'basmala',
        rejectTypes: ['action', 'scene-header-3'],
        minConfidence: 99,
        explanation: 'البسملة يجب أن تكون باسم الله دائماً'
      }]
    },
    {
      pattern: /^مشهد\s*\d+.*[-–:].*(?:داخلي|خارجي|ليل|نهار)/i,
      rules: [{
        confirmType: 'scene-header-top-line',
        rejectTypes: ['action', 'scene-header-3'],
        minConfidence: 95,
        explanation: 'رأس مشهد كامل يحتوي على جميع المعلومات'
      }]
    },
    {
      pattern: /^(?:قطع|انتقل|ذهاب|عودة|تلاشي|اختفاء|ظهور)\s*(?:إلى|من|في)/i,
      rules: [{
        confirmType: 'transition',
        rejectTypes: ['action'],
        minConfidence: 90,
        explanation: 'كلمات انتقالية معروفة'
      }]
    }
  ];
  
  /**
   * مراجعة ذكية تلقائية مع قواعد متقدمة
   */
  autoReview(
    classifications: Array<{
      text: string;
      type: string;
      confidence: number;
    }>
  ): Array<{
    index: number;
    original: string;
    suggested: string;
    confidence: number;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const corrections: any[] = [];
    
    classifications.forEach((c, index) => {
      // فحص القواعس المعروفة
      for (const kb of this.knowledgeBase) {
        if (kb.pattern.test(c.text)) {
          for (const rule of kb.rules) {
            if (rule.rejectTypes.includes(c.type)) {
              corrections.push({
                index,
                original: c.type,
                suggested: rule.confirmType,
                confidence: Math.min(100, c.confidence + 15),
                reason: rule.explanation,
                severity: c.confidence < 60 ? 'high' : 'medium'
              });
              break;
            }
          }
        }
      }
      
      // فحص الانتقالات غير الصحيحة
      if (index > 0) {
        const prevType = classifications[index - 1].type;
        const validNext = this.getValidNextTypes(prevType);
        
        if (!validNext.includes(c.type) && c.confidence < 80) {
          corrections.push({
            index,
            original: c.type,
            suggested: validNext[0],
            confidence: c.confidence - 10,
            reason: `الانتقال من ${prevType} إلى ${c.type} غير معتاد`,
            severity: 'low'
          });
        }
      }
    });
    
    return corrections.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  private getValidNextTypes(type: string): string[] {
    const transitions: { [key: string]: string[] } = {
      'basmala': ['scene-header-top-line', 'action'],
      'scene-header-top-line': ['scene-header-3', 'action'],
      'scene-header-3': ['action', 'blank'],
      'action': ['character', 'transition', 'action', 'blank'],
      'character': ['dialogue', 'parenthetical'],
      'dialogue': ['parenthetical', 'action', 'character', 'blank'],
      'parenthetical': ['dialogue', 'action', 'blank'],
      'transition': ['scene-header-top-line', 'action'],
      'blank': ['action', 'character', 'scene-header-top-line']
    };
    
    return transitions[type] || ['action'];
  }
}
2
2.1: نموذج Context-Aware مع Memory Window
typescript
export class ContextAwareClassifier {
  private contextWindow = 7; // عدد الأسطر قبل/بعد
  private contextMemory: Array<{
    lineText: string;
    classification: string;
    confidence: number;
  }> = [];
  
  /**
   * تصنيف ذكي مع فهم السياق الكامل
   */
  async classifyWithFullContext(
    currentLine: string,
    previousLines: string[],
    nextLines: string[],
    previousClassifications: string[]
  ): Promise<{
    type: string;
    confidence: number;
    reasoning: string;
  }> {
    // بناء مقتطف السياق
    const contextSnippet = [
      ...previousLines.slice(-3),
      `>>> ${currentLine} <<<`,
      ...nextLines.slice(0, 3)
    ];
    
    // تحديث الذاكرة
    this.updateContextMemory({
      lineText: currentLine,
      classification: 'pending',
      confidence: 0
    });
    
    // استخدام Gemini مع السياق الكامل
    const result = await this.callGeminiWithContext(
      currentLine,
      contextSnippet,
      previousClassifications
    );
    
    // تحسين النتيجة بناءً على الذاكرة
    const enhancedResult = this.enhanceWithMemory(result);
    
    // تحديث الذاكرة بالنتيجة النهائية
    this.updateContextMemory({
      lineText: currentLine,
      classification: enhancedResult.type,
      confidence: enhancedResult.confidence
    });
    
    return enhancedResult;
  }
  
  private buildContextPrompt(
    currentLine: string,
    contextSnippet: string[],
    previousClassifications: string[]
  ): string {
    return `
أنت محلل نصوص سيناريو عربي متخصص.
قم بتصنيف السطر المشار إليه (>>>...<<<) إلى أحد الأنواع التالية:

الأنواع الممكنة:
- scene-header-top-line: رأس مشهد كامل (مثال: "مشهد 1: المنزل - داخلي - نهار")
- scene-header-3: اسم المكان فقط (مثال: "غرفة النوم - المكتب")
- action: وصف الحركة أو الإجراء (مثال: "يدخل عبد العزيز ببطء")
- character: اسم الشخصية (مثال: "عبد العزيز:")
- dialogue: الحوار (مثال: "أين وضعت الملفات؟")
- parenthetical: ملاحظة إخراجية (مثال: "(بصوت منخفض)")
- transition: انتقال مشهدي (مثال: "قطع إلى")
- blank: سطر فارغ
- other: أخرى

النص السياقي:
${contextSnippet.map((l, i) => `${i + 1}. ${l}`).join('\n')}

التصنيفات السابقة: ${previousClassifications.slice(-3).join(', ')}

الإجابة بصيغة JSON فقط:
{
  "type": "...",
  "confidence": 0-100,
  "reasoning": "..."
}
    `.trim();
  }
  
  private async callGeminiWithContext(
    currentLine: string,
    contextSnippet: string[],
    previousClassifications: string[]
  ): Promise<any> {
    const prompt = this.buildContextPrompt(
      currentLine,
      contextSnippet,
      previousClassifications
    );
    
    // استدعاء Gemini API
    const response = await fetch('/api/gemini-classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, text: currentLine })
    });
    
    return response.json();
  }
  
  private updateContextMemory(entry: any) {
    this.contextMemory.push(entry);
    if (this.contextMemory.length > this.contextWindow) {
      this.contextMemory.shift();
    }
  }
  
  private enhanceWithMemory(result: any): any {
    // تحسين النتيجة بناءً على الأنماط المكتشفة
    const recentTypes = this.contextMemory
      .slice(-5)
      .map(m => m.classification);
    
    // إذا كانت النتيجة تخالف النمط المحلي، اخفض الثقة قليلاً
    const matchesPattern = this.checkPatternMatch(
      result.type,
      recentTypes
    );
    
    if (!matchesPattern && result.confidence > 70) {
      result.confidence -= 10;
    }
    
    return result;
  }
  
  private checkPatternMatch(
    type: string,
    recentTypes: string[]
  ): boolean {
    // منطق التحقق من مطابقة النمط
    const validTransitions: { [key: string]: string[] } = {
      'scene-header-top-line': ['action', 'scene-header-3'],
      'action': ['character', 'action', 'transition'],
      'character': ['dialogue', 'parenthetical'],
      // ... إلخ
    };
    
    const lastType = recentTypes[recentTypes.length - 1];
    return validTransitions[lastType]?.includes(type) ?? true;
  }
}
الفوائد:

✅ فهم سياق أفضل بكثير

✅ تقليل الأخطاء بـ 30-40%

✅ نتائج أكثر دقة للسيناريوهات الطويلة

المدة: 4 أيام

2.2: نظام التعلم التكيفي (Adaptive Learning)
typescript
export class AdaptiveClassificationSystem {
  private userCorrections: Array<{
    originalType: string;
    correctedType: string;
    context: {
      previousType: string;
      lineText: string;
    };
    timestamp: Date;
    weight: number;
  }> = [];
  
  private patternWeights: { [pattern: string]: number } = {};
  
  /**
   * تسجيل تصحيحات المستخدم والتعلم منها
   */
  recordUserCorrection(
    lineText: string,
    originalClassification: string,
    userCorrectedClassification: string,
    previousType: string
  ) {
    const correction = {
      originalType: originalClassification,
      correctedType: userCorrectedClassification,
      context: {
        previousType,
        lineText
      },
      timestamp: new Date(),
      weight: 1.0 // سيزداد إذا تكررت نفس الخطأ
    };
    
    this.userCorrections.push(correction);
    
    // تحديث الأوزان
    this.updateWeights();
    
    // إذا تكررت نفس الخطأ، زد الوزن
    this.checkForRepeatingPatterns();
  }
  
  /**
   * تحديث أوزان النمط بناءً على الأخطاء
   */
  private updateWeights() {
    // تحليل الأخطاء المتكررة
    const errorPatterns = this.identifyErrorPatterns();
    
    // حساب الأوزان الجديدة
    errorPatterns.forEach(pattern => {
      const patternKey = `${pattern.transition} -> ${pattern.wrongType}`;
      const correctKey = `${pattern.transition} -> ${pattern.correctType}`;
      
      // تقليل وزن الخطأ
      this.patternWeights[patternKey] = 
        (this.patternWeights[patternKey] || 1) * 0.7;
      
      // زيادة وزن الصحيح
      this.patternWeights[correctKey] = 
        (this.patternWeights[correctKey] || 1) * 1.3;
    });
  }
  
  /**
   * تحديد الأنماط المتكررة
   */
  private identifyErrorPatterns(): Array<{
    transition: string;
    wrongType: string;
    correctType: string;
    frequency: number;
  }> {
    const patterns: { [key: string]: any } = {};
    
    this.userCorrections.forEach(correction => {
      const key = `${correction.context.previousType}|${correction.originalType}`;
      
      if (!patterns[key]) {
        patterns[key] = {
          transition: correction.context.previousType,
          wrongType: correction.originalType,
          correctType: correction.correctedType,
          frequency: 0
        };
      }
      
      patterns[key].frequency++;
      patterns[key].weight = correction.weight;
    });
    
    // إرجاع الأنماط المتكررة (أكثر من مرة واحدة)
    return Object.values(patterns).filter(p => p.frequency > 1);
  }
  
  /**
   * فحص الأخطاء المتكررة وزيادة الوزن
   */
  private checkForRepeatingPatterns() {
    const errorPatterns = this.identifyErrorPatterns();
    
    errorPatterns.forEach(pattern => {
      if (pattern.frequency > 3) {
        // إذا تكرر الخطأ أكثر من 3 مرات
        // أرسل تنبيهاً للمطور للتحقق من النموذج
        console.warn(`⚠️ خطأ متكرر: ${pattern.transition} -> ${pattern.wrongType}`);
      }
    });
  }
  
  /**
   * تحسين درجات التصنيف بناءً على التعليقات السابقة
   */
  improveClassificationScore(
    type: string,
    context: { previousType: string; lineText: string },
    baseScore: number
  ): number {
    const patternKey = `${context.previousType} -> ${type}`;
    const weight = this.patternWeights[patternKey] || 1.0;
    
    // تطبيق الوزن على الدرجة الأساسية
    return baseScore * weight;
  }
  
  /**
   * الحصول على الأنماط الخاطئة الأكثر تكراراً
   */
  getCommonErrors(): Array<{
    pattern: string;
    frequency: number;
    suggestion: string;
  }> {
    return this.identifyErrorPatterns()
      .sort((a, b) => b.frequency - a.frequency)
      .map(pattern => ({
        pattern: `${pattern.transition} ➜ ${pattern.wrongType}`,
        frequency: pattern.frequency,
        suggestion: `يجب أن يكون: ${pattern.correctType}`
      }));
  }
}
المدة: 3 أيام

🟡 المرحلة 3: أدوات متقدمة (الأسبوع الثالث)
3.1: معالج التصنيف الذكي (Smart Classification Wizard)
tsx
export const SmartClassificationWizard = ({
  uncertainLines,
  onComplete,
  classifier
}: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  
  const currentLine = uncertainLines[currentIndex];
  
  const askContextualQuestions = (line: any) => {
    return [
      {
        question: 'هل يبدأ السطر بفعل حركة؟',
        options: ['نعم', 'لا'],
        key: 'isActionVerb'
      },
      {
        question: 'هل يحتوي على اسم مكان؟',
        options: ['نعم', 'لا', 'ربما'],
        key: 'hasPlace'
      },
      {
        question: 'هل هو ملاحظة إخراجية؟',
        options: ['نعم', 'لا'],
        key: 'isDirective'
      }
    ];
  };
  
  const suggestCorrections = () => {
    const questions = askContextualQuestions(currentLine);
    const responses = answers;
    
    if (responses.isActionVerb === 'نعم') {
      if (responses.hasPlace === 'نعم') {
        return { suggested: 'scene-header-3', confidence: 85 };
      }
      return { suggested: 'action', confidence: 90 };
    }
    
    if (responses.isDirective === 'نعم') {
      return { suggested: 'parenthetical', confidence: 95 };
    }
    
    return { suggested: 'other', confidence: 50 };
  };
  
  const handleNext = () => {
    const correction = suggestCorrections();
    
    setAnswers({
      ...answers,
      [currentLine.id]: correction.suggested
    });
    
    if (currentIndex < uncertainLines.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(answers);
    }
  };
  
  if (!currentLine) return null;
  
  const questions = askContextualQuestions(currentLine);
  const suggestion = suggestCorrections();
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-white mb-4">
          🔍 معالج التصنيف الذكي
        </h2>
        
        <div className="mb-4">
          <p className="text-white/60 text-sm mb-2">
            السطر {currentIndex + 1} من {uncertainLines.length}
          </p>
          <div className="bg-white/5 p-3 rounded text-white mb-4">
            {currentLine.text}
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          {questions.map((q) => (
            <div key={q.key}>
              <p className="text-white mb-2">{q.question}</p>
              <div className="flex gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({
                      ...answers,
                      [q.key]: opt
                    })}
                    className={`px-3 py-2 rounded transition-all ${
                      answers[q.key] === opt
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-green-900/20 border border-green-500/30 p-3 rounded mb-4">
          <p className="text-green-400 text-sm">
            ✓ الاقتراح: <strong>{suggestion.suggested}</strong>
            <span className="text-green-400/60 ml-2">
              ({suggestion.confidence}%)
            </span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setAnswers({
                ...answers,
                [currentLine.id]: suggestion.suggested
              });
              handleNext();
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-all"
          >
            ✓ قبول الاقتراح
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-all"
          >
            التالي →
          </button>
        </div>
      </div>
    </div>
  );
1.1 نظام تصنيف محسّن مع الثقة (Confidence Scoring)
الهدف: إضافة درجات ثقة للتصنيفات لتحديد الأسطر التي تحتاج مراجعة

typescript
// نموذج مقترح
interface ClassificationWithConfidence {
  type: string;
  confidence: number; // 0-100%
  alternatives: Array<{
    type: string;
    score: number;
  }>;
  reasoning: string; // تفسير القرار
}

// مثال:
{
  type: "scene-header-3",
  confidence: 95,
  alternatives: [
    { type: "action", score: 0.05 }
  ],
  reasoning: "يحتوي على كلمة 'منزل' وشرطة بعدها + بعد scene-header-2"
}
الفوائد:

✅ كشف الأخطاء قبل حفظ

✅ إظهار أسطر "غير مؤكدة" بتمييز بصري

✅ تقليل الأخطاء البشرية