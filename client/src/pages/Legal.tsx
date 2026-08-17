import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

const LAST_UPDATED = "17 أغسطس 2026";

type Section = { heading: string; body: string };
type Document = { title: string; intro: string; notice?: string; sections: Section[] };
type DocumentKey = "privacy" | "terms" | "content" | "copyright" | "contact";

const documents: Record<DocumentKey, Document> = {
  privacy: {
    title: "سياسة الخصوصية",
    intro: "توضح هذه السياسة كيف تتعامل منصة «روايتك بالعربية» مع البيانات اللازمة لتشغيل الحساب، وتقديم تجربة قراءة آمنة، وتحسين الخدمات. نلتزم بجمع الحد الأدنى من البيانات اللازمة وباستخدامها للغرض الذي جُمعت من أجله.",
    sections: [
      { heading: "نطاق السياسة والجهة المسؤولة", body: "تنطبق هذه السياسة على الموقع وحسابات المستخدمين وخدمات القراءة والمكتبة والإشعارات والمجتمع والاشتراكات المرتبطة بالمنصة. يُقصد بعبارة «المنصة» الجهة التي تدير روايتك بالعربية، وبعبارة «المستخدم» كل من يتصفح الخدمة أو ينشئ حسابًا أو يتفاعل مع محتواها." },
      { heading: "البيانات التي قد نعالجها", body: "قد نعالج اسم الحساب والبريد الإلكتروني ومعرّف الحساب وطريقة تسجيل الدخول، وبيانات الملف الاختيارية مثل الصورة والنبذة والبلد واللغة المفضلة. كما نعالج بيانات المكتبة والمفضلة وموضع القراءة والتقييمات والتعليقات واقتراحات الترجمة وسجل النشاط والنقاط والمكافآت التي استبدلها المستخدم. وقد تُسجل بيانات تقنية مثل نوع الجهاز والمتصفح وعناوين الشبكة وسجلات الأخطاء بالقدر اللازم للأمان والتشغيل." },
      { heading: "أغراض الاستخدام", body: "نستخدم البيانات لتسجيل الدخول وإدارة الحساب، وحفظ التقدم والمفضلة، وتقديم الإشعارات التي يختارها المستخدم، وإدارة الاشتراكات والدفع عبر مزود الدفع، وحماية المنصة من إساءة الاستخدام، ودعم طلبات المستخدم، وتحسين الأداء، وإدارة المحتوى والبلاغات. لا تُستخدم الملاحظات الشخصية أو المكتبة الخاصة على أنها محتوى عام إلا إذا اختار المستخدم نشرها صراحةً وفق خصائص المنصة." },
      { heading: "المشاركة ومقدمو الخدمة", body: "لا نبيع البيانات الشخصية. قد نشارك الحد الأدنى اللازم مع مزودي الاستضافة والتخزين والمصادقة والإشعارات والتحليلات ومزود الدفع، كلٌ في حدود تقديم الخدمة أو حماية المنصة. لا نخزن بيانات بطاقات الدفع الحساسة داخل المنصة؛ تُعالج عملية الدفع عبر صفحة مزود الدفع المعتمد وشروطه الخاصة." },
      { heading: "الاحتفاظ والأمان", body: "نحتفظ بالبيانات طوال المدة اللازمة لتقديم الخدمة أو الوفاء بالالتزامات التشغيلية أو معالجة النزاعات والبلاغات، ثم نحذفها أو نجهل هويتها عندما لا تعود لازمة، ما لم يفرض القانون مدة أطول. نستخدم ضوابط وصول وتخزينًا خارجيًا وإجراءات حماية معقولة، مع الإقرار بأن أي نقل عبر الإنترنت لا يخلو من المخاطر." },
      { heading: "حقوق المستخدم", body: "يمكن للمستخدم طلب الوصول إلى بياناته أو تصحيحها أو تحديثها أو حذفها، وطلب توضيح استخدام بياناته، وإيقاف بعض الإشعارات، وفق القيود القانونية ومتطلبات الاحتفاظ. نتحقق من هوية مقدم الطلب قبل تنفيذ الطلبات الحساسة، وقد نحتفظ بسجل محدود لإثبات تنفيذ الطلب أو حماية الحقوق." },
      { heading: "التحديثات والتواصل", body: "قد نحدّث هذه السياسة عند إضافة وظيفة أو تغيير طريقة معالجة البيانات. نعرض تاريخ آخر تحديث في أعلى الصفحة، ويُعد استمرار استخدام الخدمة بعد نشر التعديل قبولًا للنسخة المحدثة بالقدر الذي يسمح به القانون. للاستفسارات أو طلبات الخصوصية، استخدم صفحة «تواصل معنا»." },
    ],
  },
  terms: {
    title: "شروط الاستخدام",
    intro: "تنظم هذه الشروط استخدام منصة «روايتك بالعربية» لخدمات القراءة والنشر والمجتمع والاشتراكات. باستخدام المنصة أو إنشاء حساب، يقر المستخدم بأنه قرأ هذه الشروط ويفهم مسؤولياته، مع خضوع ذلك للقانون الواجب التطبيق.",
    notice: "هذه الشروط مسودة تشغيلية مخصصة للمنصة، ويجب اعتمادها بعد مراجعة قانونية تحدد اسم الجهة المشغلة وولايتها القضائية وآلية التعاقد المناسبة.",
    sections: [
      { heading: "الحساب والمسؤولية الشخصية", body: "يجب تقديم بيانات صحيحة وتحديثها عند الحاجة، والحفاظ على سرية وسيلة الدخول، وإبلاغ المنصة عند الاشتباه في استخدام غير مصرح به. يتحمل المستخدم مسؤولية النشاط الذي يتم من خلال حسابه ما لم يثبت وجود سبب خارج عن سيطرته، ولا يجوز إنشاء حسابات للتحايل على الإيقاف أو حدود الباقات." },
      { heading: "استخدام المحتوى", body: "يمنح الوصول إلى الرواية أو الفصل حق القراءة أو الاستماع ضمن النطاق الذي تعرضه المنصة والباقة المختارة، ولا يمنح ملكية العمل أو حق نسخه أو إعادة نشره أو توزيعه أو تسجيله أو استخدامه تجاريًا دون إذن صاحب الحق. يجب احترام وسائل الحماية والحدود التقنية وعدم محاولة تجاوزها." },
      { heading: "المحتوى والتفاعلات", body: "قد تتيح المنصة تقييمات ومراجعات وتعليقات واقتراحات ترجمة وملاحظات شخصية. يظل المستخدم مسؤولًا عن المحتوى الذي ينشره، ويجب أن يكون مشروعًا وغير مضلل وغير منتهك للخصوصية أو حقوق الملكية الفكرية وألا يتضمن تهديدًا أو تحريضًا أو كراهية أو تشهيرًا أو حرقًا متعمدًا للأحداث خارج السياق المخصص." },
      { heading: "الاشتراكات والدفع", body: "تُعرض الباقات والأسعار والحدود والمدة قبل إتمام الاشتراك. يبدأ الوصول المدفوع بعد تأكيد الدفع من مزود الدفع، وقد تخضع المعاملة لسياسة المزود وشروطه. لا تُعد النقاط أو الشارات أو المزايا الرقمية نقودًا ولا تُستبدل نقدًا، ولا يجوز بيعها أو نقلها خارج المنصة." },
      { heading: "التعليق أو الإنهاء", body: "يجوز للمنصة تعليق الحساب أو المحتوى أو إزالة مادة أو إنهاء الوصول عند وجود مخالفة أو خطر أمني أو بلاغ حقوقي جدي أو طلب قانوني، مع مراعاة الإشعار وإتاحة الاعتراض متى كان ذلك مناسبًا. لا يمنع إنهاء الحساب استمرار الالتزامات التي بطبيعتها تستمر بعد الإنهاء، مثل حقوق النشر والسرية وتسوية النزاعات." },
      { heading: "التوافر والمسؤولية", body: "نسعى إلى تشغيل الخدمة بصورة مستقرة، لكن قد تحدث صيانة أو انقطاعات أو أخطاء أو تغييرات في المحتوى أو الخدمات الخارجية. تقدم المنصة كما هي وفي حدود ما يسمح به القانون، ولا نضمن توفر كل محتوى أو وظيفة بصورة مستمرة، ولا نتحمل أضرارًا لا يمكن استبعادها قانونًا أو تنشأ من استخدام غير مشروع أو غير آمن للخدمة." },
      { heading: "التعديلات والقانون الواجب التطبيق", body: "يجوز تحديث الشروط عند تغير الخدمة أو المتطلبات القانونية، مع عرض تاريخ السريان. يحدد القانون والاختصاص القضائي النهائيان بعد إدخال بيانات الجهة المشغلة ومراجعة محامٍ مختص؛ ولا يُفهم من هذه الصفحة وحدها تحديد ولاية قانونية غير معلنة." },
    ],
  },
  content: {
    title: "سياسة المحتوى",
    intro: "تضع هذه السياسة معايير المحتوى المنشور والتفاعلات داخل «روايتك بالعربية»، وتوازن بين حرية التعبير الأدبي وحقوق المؤلف وسلامة القراء. تخضع الأعمال المنشورة للمراجعة والإدارة ولا يعني ظهورها استمرار إتاحتها إلى الأبد.",
    sections: [
      { heading: "المحتوى المقبول", body: "يجب أن يكون العمل أصليًا أو منشورًا بترخيص أو تفويض يتيح عرضه، وأن يحترم حقوق المؤلفين والناشرين والعلامات التجارية وخصوصية الأشخاص. يجب أن تكون المعلومات المصاحبة للعمل دقيقة قدر الإمكان، بما في ذلك اسم المؤلف والتصنيف والتنبيه إلى المحتوى الحساس عند الحاجة." },
      { heading: "المحتوى المحظور", body: "يُحظر استخدام المنصة لنشر أو ترويج مواد منسوخة بلا إذن، أو بيانات شخصية منشورة دون أساس مشروع، أو تهديدات وتحرش وخطاب كراهية وتحريض على العنف أو الجريمة، أو احتيال وانتحال، أو برمجيات ضارة، أو محتوى يهدف إلى استغلال القُصّر أو تعريضهم للخطر. كما يُحظر التلاعب بالتقييمات أو النقاط أو الإشعارات أو أنظمة الوصول." },
      { heading: "محتوى المستخدم والتعليقات", body: "قد تُراجع التعليقات والمراجعات والاقتراحات للتأكد من التزامها بالقواعد. لا تضمن المنصة صحة كل رأي ينشره المستخدم ولا تتبناه، لكنها قد تخفي أو تعدل تنسيقًا محدودًا أو تزيل المحتوى المخالف، مع حفظ السجل اللازم للتحقيق في البلاغات." },
      { heading: "الترجمة والمراجعة", body: "الترجمات الآلية أو اقتراحات الترجمة أدوات مساعدة وقد تحتاج إلى مراجعة بشرية. لا يجوز استخدامها لتغيير النص الأصلي أو نسب عمل إلى مؤلف آخر، وتحتفظ المنصة بحق اعتماد الترجمة أو رفضها أو طلب تعديلها وفق إجراءات المراجعة." },
      { heading: "البلاغات والإجراءات", body: "يمكن إرسال بلاغ من صفحة «تواصل معنا» مع الرابط المباشر ووصف المشكلة والأدلة المتاحة. قد تطلب الإدارة معلومات إضافية، وتطبق إجراءات متدرجة تشمل إخفاء المحتوى مؤقتًا أو طلب التصحيح أو إزالة العمل أو تعليق الحساب أو إحالة الأمر إلى الجهة المختصة عند وجود التزام قانوني." },
      { heading: "الاعتراض", body: "يمكن لصاحب المحتوى أو مقدم البلاغ طلب مراجعة القرار برسالة واضحة تشرح سبب الاعتراض وتضيف أي معلومات جديدة. لا تضمن المنصة نتيجة محددة، لكنها تسعى إلى التعامل مع الطلبات بصورة متسقة ومتناسبة مع طبيعة المخالفة." },
    ],
  },
  copyright: {
    title: "حقوق النشر والملكية الفكرية",
    intro: "تحترم «روايتك بالعربية» حقوق المؤلفين والناشرين وأصحاب العلامات والأعمال المشتقة، ولا تقصد إتاحة أي عمل إلا ضمن حق أو ترخيص أو تفويض مناسب. جميع أسماء الأعمال والشعارات تظل لأصحابها ما لم يذكر خلاف ذلك.",
    sections: [
      { heading: "حقوق الأعمال المنشورة", body: "تظل الروايات والفصول والأغلفة والتسجيلات الصوتية والترجمات والمواد المصاحبة مملوكة لأصحاب حقوقها. يمنح نشر العمل على المنصة، بحسب الاتفاق مع الجهة الناشرة، ترخيص العرض أو القراءة أو الاستماع بالقدر المحدد، ولا ينقل الملكية إلى المنصة أو المستخدمين." },
      { heading: "ما يحتاج إلى إذن", body: "لا يجوز نسخ العمل أو تنزيله خارج الوظائف المصرح بها أو إعادة نشره أو ترجمته أو تحويله أو استخدامه تجاريًا أو مشاركة حساب أو رابط وصول مقيد، إلا بموافقة خطية من صاحب الحق أو في حدود استثناء قانوني واجب التطبيق." },
      { heading: "بلاغ انتهاك حقوق النشر", body: "يرجى إرسال اسم صاحب الحق أو ممثله، ووسيلة اتصال موثوقة، ووصف العمل المحمي، والرابط المباشر للمادة محل الاعتراض، وبيان سبب الملكية أو التفويض، وتحديد الجزء محل الانتهاك بدقة، وإقرار حسن النية وصحة المعلومات. لا ترسل بيانات شخصية غير لازمة." },
      { heading: "مراجعة البلاغ", body: "تراجع الإدارة البلاغات المكتملة، وقد تطلب مستندًا يثبت الصفة أو الملكية، وتخفي المادة مؤقتًا عند الحاجة، وتتواصل مع الطرف الناشر، وتتخذ قرارًا مناسبًا وفق المعلومات المتاحة والقانون الواجب التطبيق. البلاغ الكيدي أو المضلل قد يعرض صاحبه للمسؤولية." },
      { heading: "حقوق صاحب المحتوى", body: "يمكن لصاحب العمل الرد على البلاغ وتقديم دليل الترخيص أو الملكية أو تفسير الاستخدام. لا تعيد المنصة نشر المراسلات أو المستندات للعامة، وقد تحتفظ بها للامتثال وحماية الحقوق وإثبات الإجراءات." },
    ],
  },
  contact: {
    title: "تواصل معنا",
    intro: "تستقبل إدارة «روايتك بالعربية» الاستفسارات العامة، وطلبات الخصوصية، وبلاغات حقوق النشر، وملاحظات الدعم الفني من خلال النموذج التالي. أرسل رسالة واحدة واضحة لكل موضوع لتسهيل المتابعة.",
    sections: [
      { heading: "اختر موضوعًا دقيقًا", body: "للاستفسارات العامة اذكر السؤال والصفحة المعنية. لطلبات الخصوصية اذكر نوع الطلب والحساب المرتبط به دون إرسال كلمة المرور. لبلاغات الحقوق أرفق الرابط المباشر وبيانات الملكية أو التفويض. وللدعم الفني اذكر الجهاز والمتصفح ووقت حدوث الخطأ والخطوات التي أدت إليه." },
      { heading: "الاستجابة وحماية المراسلات", body: "تصل الرسائل إلى لوحة إدارة المنصة ويُسمح للموظفين المخولين بمعالجتها. قد نطلب معلومات إضافية للتحقق من الهوية أو الملكية. لا تستخدم النموذج لإرسال بيانات بطاقات الدفع أو كلمات المرور أو وثائق حساسة غير لازمة." },
    ],
  },
};

export const DEFAULT_LEGAL_DOCUMENTS_CONTENT = documents;

export default function Legal({ document }: { document: string }) {
  const { user } = useAuth();
  const documentKey = (document in documents ? document : "privacy") as DocumentKey;
  const { data: managedDocuments } = trpc.platform.legalDocuments.useQuery();
  const { data: socialLinks } = trpc.platform.socialLinks.useQuery(undefined, { enabled: document === "contact" });
  const item = managedDocuments?.[documentKey] ?? documents[documentKey] ?? documents.privacy;
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", subject: "", message: "" });
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const sendMessage = trpc.contact.send.useMutation({ onSuccess: () => { setForm(current => ({ ...current, subject: "", message: "" })); setConfirmationOpen(true); } });
  const updateForm = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));

  return <PublicLayout><main className="container max-w-4xl py-14 md:py-20" dir="rtl"><div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-xs font-bold tracking-[.18em] text-primary">وثائق المنصة</p><h1 className="mt-2 font-serif text-4xl md:text-5xl">{item.title}</h1><p className="mt-5 text-lg leading-9 text-muted-foreground">{item.intro}</p><p className="mt-3 text-xs text-muted-foreground">آخر تحديث: {LAST_UPDATED}</p></div></div>{item.notice ? <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground"><strong className="text-foreground">تنبيه مهم: </strong>{item.notice}</div> : null}{document === "contact" ? <form className="mt-10 grid gap-4 rounded-2xl border border-border bg-background p-5" onSubmit={event => { event.preventDefault(); sendMessage.mutate(form); }}><div className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /><h2 className="font-serif text-2xl">أرسل رسالة إلى الإدارة</h2></div><p className="text-sm leading-7 text-muted-foreground">لا تكتب كلمة المرور أو بيانات البطاقة أو أي معلومات لا تحتاجها الإدارة لمعالجة طلبك.</p><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">الاسم<input required minLength={2} maxLength={160} value={form.name} onChange={event => updateForm("name", event.target.value)} placeholder="الاسم الكامل" className="h-11 rounded-xl border border-border bg-card px-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">البريد الإلكتروني<input required type="email" maxLength={320} value={form.email} onChange={event => updateForm("email", event.target.value)} placeholder="name@example.com" dir="ltr" className="h-11 rounded-xl border border-border bg-card px-3 font-normal text-left" /></label></div><label className="grid gap-2 text-sm font-semibold">موضوع الرسالة<input required minLength={3} maxLength={220} value={form.subject} onChange={event => updateForm("subject", event.target.value)} placeholder="مثال: طلب تصحيح بيانات" className="h-11 rounded-xl border border-border bg-card px-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">الرسالة<textarea required minLength={10} maxLength={5000} value={form.message} onChange={event => updateForm("message", event.target.value)} placeholder="اكتب التفاصيل بوضوح" className="min-h-36 rounded-xl border border-border bg-card p-3 font-normal" /></label><Button type="submit" disabled={sendMessage.isPending}>{sendMessage.isPending ? "جارٍ الإرسال..." : "إرسال الرسالة"}</Button>{sendMessage.error ? <p className="text-sm text-destructive">تعذر إرسال الرسالة حاليًا. تحقق من البيانات وحاول مرة أخرى.</p> : null}</form> : null}<div className="mt-12 space-y-10">{item.sections.map(section => <section key={section.heading}><h2 className="font-serif text-2xl md:text-3xl">{section.heading}</h2><p className="mt-3 leading-8 text-muted-foreground">{section.body}</p></section>)}</div>{document === "contact" && socialLinks?.length ? <section className="mt-12 border-t border-border pt-8"><h2 className="font-serif text-2xl">روابط التواصل الرسمية</h2><div className="mt-4 flex flex-wrap gap-3">{socialLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">{link.label}</a>)}</div></section> : null}</div><Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}><DialogContent dir="rtl" className="sm:max-w-md"><DialogHeader><DialogTitle>تم إرسال رسالتك بنجاح</DialogTitle><DialogDescription>استلمت إدارة المنصة رسالتك، وسيتم التعامل معها من خلال لوحة الإدارة. شكرًا لتواصلك معنا.</DialogDescription></DialogHeader><Button type="button" onClick={() => setConfirmationOpen(false)}>حسنًا</Button></DialogContent></Dialog></main></PublicLayout>;
}
