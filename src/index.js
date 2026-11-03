import 'dotenv/config';
import {Bot,InlineKeyboard} from 'grammy';
import {user,group,message,points,member,top,settings,lock,set,warn,game,currentGame,report,stats,users,groups,destinations,userGroups,addReply,listReplies,removeReply,pendingReports,resolveReport,addMandatoryChannel,mandatoryChannels,removeMandatoryChannel,markGroupLeft,groupMembers,resetWarnings,groupConfig,setGroupConfig,logAdmin,adminLogs,groupBan,groupUnban,addBlockedWord,removeBlockedWord,blockedWords} from './db.js';
const bot=new Bot(process.env.BOT_TOKEN||''); const OWNER=Number(process.env.OWNER_ID||0);
if(!process.env.BOT_TOKEN) throw Error('أضف BOT_TOKEN بملف .env');
const quiz=[
['😎','سمايل',['كول','رائع','واثق','متكبر']],['😂','ضحك',['ضحك','يضحك','مضحك','قهقهة']],['🥶','بردان',['بردان','برد','بارد']],['🤔','يفكر',['يفكر','تفكير','محتار']],['😍','حب',['حب','معجب','عاشق','يحب']],['😭','يبچي',['يبچي','بكاء','حزين']],['🥳','فرحان',['فرحان','مبسوط','مستانس']],['😴','نعسان',['نعسان','نايم','نوم']],['🤯','منصدم',['منصدم','مصدوم','مندهش']],['😡','معصب',['معصب','غاضب','زعلان']],['🤫','ساكت',['ساكت','اسكت','سر']],['🤢','مقرف',['مقرف','مستقذر','غثيان']],['🤩','مبهور',['مبهور','منبهر','معجب']],['😇','ملاك',['ملاك','طيب','بريء']],['🥺','يتوسل',['يتوسل','يرجّي','ترجي']],['😏','ماكر',['ماكر','خبيث','مراوغ']],['😬','محرج',['محرج','متوتر','مستحي']],['🤝','اتفاق',['اتفاق','مصافحة','تصالح']],['🙏','دعاء',['دعاء','رجاء','يتوسل']],['💪','قوة',['قوة','قوي','عضلات']],['🫡','احترام',['احترام','تحية','انضباط']],['🤦','متحسر',['متحسر','ندمان','مستاء']],['🤷','مايدري',['مايدري','لا اعرف','محتار']],['🫠','ذاب',['ذاب','ذوبان','منحر']],['🤠','كاوبوي',['كاوبوي','راعي بقر']],['😵','دوخان',['دوخان','دوخة','دايخ']],['🤐','كاتم',['كاتم','ساكت','مكتوم']],['😋','لذيذ',['لذيذ','طيب','يشهي']],['🤑','طماع',['طماع','فلوس','ثري']],['🤗','حضن',['حضن','عناق','احتضان']]
];
const dismantleWords=['العراق','بغداد','النجف','البصرة','كربلاء','مدرسة','مكتبة','سيارة','حديقة','صداقة','حاسوب','تلفون','قمر','شمس','نجمة','وردة','تفاحة','برتقالة','مطر','شتاء','ربيع','صيف','خريف','عائلة','محبة','سلام','حرية','بطولة','مغامرة','ابتسامة','مستقبل','ذكريات','موسيقى','طائرة','قطار','مستشفى','جامعة','معرفة','ذكاء','سعادة','قهوة','شاي','عصفور','فراشة','سلحفاة','دلفين','نخلة','نهر','جبل','بحر','صحراء','كتاب','قلم','نافذة','مفتاح','ساعة','حقيبة','وسادة','مروحة','مصباح','حاسبة','رياضة','كرة','ملعب','صديق','جيران','شارع','مدينة','قرية','سفينة','جزيرة','غيمة','رعد','برق','ثلج','زهرة','عسل','خبز','جبن','تمر','رمان','موز','عنب','ليمون','فراولة','دراجة','مظلة','مرآة','رسالة','هاتف','انترنت','برمجة','روبوت','نغنوغ'];
const ownerState=new Map();
const lastMessages=new Map();
const floodState=new Map();
const replies={
"هلا":["هلا وغلا، نورت اللمة 😎","هلا بيك عيني، شلونك؟","يا مية هلا، المكان نور 🌹","هاا هلا بالحبيب، شكو ماكو؟"],
"مرحبا":["مرحبتين يا وردة","يا هلا ومرحبا، نورت","أهلاً وسهلاً عيني","مرحبا بيك، شرفت اللمة 😄"],
"السلام":["وعليكم السلام ورحمة الله ❤️","وعليكم السلام، هلا بيك","السلام عليكم، نورتنا","وعليكم السلام، شخبارك؟"],
"شلونك":["بخير دامك بخير، إنت شلونك؟","تمام التمام، إنت شمسوي؟","عايشين على البركة 😂","زينين، بس ننتظر سوالفك 😎"],
"شخبارك":["كلشي تمام، إنت شمسوي؟","ماكو غير الخير والحمدلله","أخبارنا مثل النت، مرة سريع ومرة لا 😂","بخير، هات أخبارك"],
"شكرا":["تدلل عيني، بالخدمة ❤️","ولو، ما سوينا شي","تستاهل أكثر من هذا","العفو يالغالي، نورت"],
"احبك":["فدوة لهالقلب ❤️","هاا لا تخليني أستحي 😂","الحب متبادل يا بعدهم","دخيل هالحچي الحلو 😏"],
"هههه":["دوم هالضحكة 😂","ضحكتك عدوى، ضحكتني وياك","ها شنو المضحك خل نشوف؟ 😂","استمر، اللمة تحتاج ضحك"],
"باي":["الله وياك ويحفظك","لا تطول الغيبة عيني","باي، بس لا تنسانا 😄","نشوفك على خير"],
"صباح":["صباح الورد والياسمين 🌹","صباح النور عيني","صباح الخير على أهل اللمة","صباحك ضحكة وراحة بال"],
"مساء":["مساك خير وسعادة","مساء الورد يا غالي","مسا الخير، شكو جديد؟","مساء الطيبين 🌙"],
"تعبان":["سلامتك عيني، ارتاح شوية","الله يقويك ويعافيك","تعال نضحكك يمكن تروح التعب 😂","دير بالك على نفسك"],
"زعلان":["لا تضوج، الدنيا ما تسوى ❤️","تعال فضفض ونسمعك","منو مزعلك؟ نجيبله نغنوغ 😂","هديها عيني، باچر أحلى"],
"عراقي":["ونعم بأهل العراق 🇮🇶","العراق وأهله تاج الراس","هلا بأهل الرافدين","عراقي يعني نخوة وطيبة 😎"],
"يمعود":["ها يمعود شبيك؟ 😂","فدوة إلك يمعود","آمر يمعود، شتريد؟","هاا شنو السالفة يمعود؟"],
"كفو":["كفوك الطيب يا بطل","كفو منك ومن حچيّك","عاشت إيدك، كفو والله","كفووو، رفعت الراس 😎"],
"نورت":["النور نورك يا بعدهم","منور بوجودك ❤️","اللمة نورت بيك","نورت المكان والگلوب"],
"تسلم":["تسلم عيونك","الله يسلمك ويحفظك","تعيش عيني","تسلم من كل شر"],
"فدوة":["فدوة لعيونك","بعد روحي إنت","فدوة لهالحچي 😂","تدلل، فدوة إلك"],
"حبيبي":["حبيب الگلب يا غالي","تدلل حبيبي","الغالي ما يغلى عليه","حبيبنا إنت، نورت"],
"عفية":["عاشت إيدك","عفية عليك يا بطل","هذا الحچي السنع 😎","عفية، استمر هيچ"],
"شلون":["بسهولة عيني","تدلل أشرحلك","شلون يعني؟ وضحلي 😂","آمر، شنو تريد تعرف؟"],
"وين":["هنا يمكم، لا تخاف 😂","موجود بالزاوية أراقب اللمة","هنا يا بعدهم","وين أروح؟ نغنوغ موجود 😎"],
"شنو":["سؤال قوي هذا 😂","تدلل عيني، شنو تريد؟","شنو شنو؟ خليها على الله 😂","آمر، نغنوغ حاضر"],
"ها":["هاا تفضل عيني","آمر شبيك؟","ها شنو عندك؟ 😂","هااا نسمعك"],
"جوعان":["روح كُل عيني لا تنتظرني أطبخ 😂","عافية مقدماً","هاي اللمة ما تشبع، روح للمطبخ 😂","جيبلي وياك سندويچ 😏"],
"نعسان":["نام وارتاح عيني","تصبح على خير","لا تقاوم النوم، راح تغلبك 😂","روح نام قبل لا تحچي وأنت نايم"],
"مبروك":["تستاهل الفرحة 🎉","ألف مبروك يا بطل","مبروك ومنها للأعلى","تستاهل كل خير يا غالي"],
"مشتاق":["الشوگ متبادل","لا تطول الغيبة بعد","تعال للمة وخلي الشوگ يروح 😂","مشتاقين لسوالفك"],
"الله":["الله كريم","سبحانه وتعالى","الله يفرجها على الجميع","يا رب الخير والبركة"],
"الحمدلله":["دوم الحمد والشكر","الحمدلله على كل حال","الحمدلله دائماً وأبداً","الحمدلله، المهم العافية"],
"خوش":["من ذوقك عيني","إنت الخوش كله","خوش حچي من خوش ناس","خوش، هسه صارت اللمة خوش 😎"],
"كلش":["كلش خوش حچي","كلش؟ يعني قوي 😂","إي كلش عيني","كلش على كيفك"],
"سلامات":["الله يسلمك","تسلم من كل شر","سلامتك من كل مكروه","الله يحفظك عيني"],
"مريض":["ألف سلامة عليك","الله يشافيك ويعافيك","سلامات، ارتاح وخليها على الله","عافية عليك يا غالي"],
"تصبح":["وإنت من أهل الخير","أحلام سعيدة يا غالي","تصبح على راحة بال","تصبح على خير ولا تنسى اللمة 😂"],
"عاشت":["عاشت أيامك","عاشت إيدك","عاش راسك","عاشت سوالفك الحلوة"],
"غالي":["والله الغلا غلاك","إنت الغالي يا بعدهم","الغالي ما يحتاج تعريف","تاج الراس يا غالي"],
"حلو":["الحلو حچيّك","من ذوقك يا ورد","حلو بوجودكم 😎","إذا عجبك نزيدك حلو 😂"],
"تمام":["تمام التمام","زين دامك تمام","عاشت الروح المرتاحة","تمام، هسه نكمل سوالفنا 😄"],
"زين":["زين عليك","دامك زين كلشي زين","زين، خليها ماشية","زينين وياك عيني"],
"اي":["إي عيني، نسمعك","إي وبقوة 😎","إي شبيك مستغرب؟ 😂","إي نعم، آمر"],
"لا":["لااا ليش؟ 😂","براحتك عيني","لا؟ هاي قوية","تمام، نحترم القرار 😄"],
"ليش":["لأن نغنوغ يريد يعرف 😂","سؤال فلسفي هذا","ليش شنو؟ وضحلي","يمكن لأن اللمة هيچ 😎"],
"تعال":["جيت عيني 😎","هاا حاضر، شتريد؟","بالخدمة، وين نروح؟","جايك لا تستعجل 😂"],
"روح":["أروح لو أبقى أراقبكم؟ 😂","حاضر عيني","أروح بس أرجع بسرعة","منو يطرد نغنوغ؟ 😏"],
"دقيقة":["خذ راحتك عيني","دقيقة بس لا تصير ساعة 😂","ننتظرك","تمام، نغنوغ يحسب الوقت 😎"],
"هسه":["هسه شنو؟","هسه حاضر","هسه وقت السوالف","هسه هسه، لا تستعجل 😂"],
"باجر":["باجر على الله","إن شاء الله باچر أحلى","باجر نريد أخبار حلوة","باجر لا تنسى وعدك 😏"],
"اليوم":["اليوم يومنا 😎","اليوم خير إن شاء الله","شنو مخطط اليوم؟","اليوم اللمة غير شكل 😂"],
"ليل":["ليل وسوالف وونسة 🌙","الليل حلو ويا اللمة","ليلنا طويل، لا أحد ينام 😂","تصير سوالف الليل هنانا"],
"نهار":["نهارك سعيد","نهاركم ورد","نهار جديد وخير جديد","نهاركم ضحكة وراحة بال"],
"ضحك":["دوم الضحكة 😂","الضحك علاج مجاني","ضحكوا، الدنيا قصيرة","نغنوغ يحب اللمة الضاحكة 😎"],
"بچي":["لا تبچي عيني ❤️","هديها، كلها تعدي","منو مزعلك؟","تعال نبدل البچي بضحكة 😂"],
"فرحان":["دوم الفرح يا رب","فرحتك تفرحنا","عاشت هالروح المستانسة 😎","خلي الفرح يكمل باللمة"],
"مبسوط":["دومها يا رب","خوش، هيچ نريدك","المبسوط يونس اللمة 😂","عاشت النفسية الحلوة"],
"طفشان":["تعال نفتح سوالف 😂","الطفش عدونا الرسمي","عندي لك لعبة، لا تنام","خل نضحك ونكسر الطفش"],
"برد":["تدفى عيني 😂","البس جاكيت ولا تتفلسف","برد؟ هات بطانية","الشتا يريد چاي وشال ☕"],
"حر":["اشرب مي عيني","الحر مو سهل 😂","شغل المكيف وارتاح","الله يعين أهل الحر"],
"مطر":["يا سلام على المطر 🌧️","ريحة المطر غير","خليها مطرة خير وبركة","المطر يريد چاي وسوالف ☕"],
"ان شاء":["إن شاء الله خير","يا رب تتحقق","إن شاء الله على خير","تفائل، الجاي أحلى"],
"فزت":["عاشت إيدك يا بطل 🏆","كفو، رفعت الراس","الفوز إلك اليوم 😎","هسه صرت تخوف المنافسين 😂"],
"خسرت":["تعوضها بالمرة الجاية","لا تضوج، اللعب للتسلية","الخسارة مو نهاية الدنيا 😂","نغنوغ يكول حاول مرة ثانية"],
"لعب":["يلا نلعب 😎","هات التحدي","اللعبة أحلى وياكم","منو مستعد يخسر؟ 😂"],
"نقاط":["اجمع أكثر وخلي التوب يرتجف","النقاط تنتظر الأبطال 🏆","لا تضيعها عيني","شوية لعب وتصير متصدر"],
"توب":["التوب محجوز للأقوياء 😎","منو يريد ينافس؟","شوف التوب واشتغل","اليوم غير، باچر نبدل المتصدر 😂"],
"معاني":["جاهزين للتحدي؟ 🧠","هات الكلمة ونشوف الشطار","نغنوغ يحب لعبة المعاني","منو أسرع واحد؟ 😏"],
"رابط":["دير بالك، الروابط عليها عين نغنوغ 👀","إذا رابط مسموح تمام","لا ترسل شي مشبوه عيني","نغنوغ يراقب الروابط 😎"],
"ممنوع":["الممنوع ممنوع عيني 😂","القوانين فوق الكل","لا تجرب حظك ويا نغنوغ","خلينا على المسموح ونرتاح"],
"مشرف":["احترم المشرف عيني","المشرف عنده شغل 😂","تدلل يا مشرف","المشرف إذا حضر، اللمة تهدأ 😎"],
"ادمن":["الأدمن وصل، عدلوا جلستكم 😂","هلا بالأدمن","تدلل يا أدمن","الأدمن عينه على اللمة 👀"],
"فزعة":["فزعة يا أهل اللمة!","حاضرين للفزعة 😎","أهل العراق أهل فزعة","نغنوغ أول واحد بالصف 😂"],
"بغداد":["بغداد الحلوة ❤️","هلا بأهل بغداد","بغداد أم الدنيا","دجلة وبغداد وسوالفها غير"],
"نجف":["هلا بأهل النجف","النجف إلها هيبة ❤️","ونعم من نجفنا","أهل النجف على الراس"],
"بصرة":["هلا بأهل البصرة","البصرة الفيحاء 🌴","ونعم من أهل البصرة","جو البصرة وسوالفها غير"],
"كربلاء":["هلا بأهل كربلاء","كربلاء على الراس ❤️","ونعم من أهل كربلاء","مدينة الطيب والكرم"],
"موصل":["هلا بأهل الموصل","ونعم من أهل الموصل","الموصل وأهلها غالين","تحية لأهل الموصل ❤️"],
"دنيا":["الدنيا يوم إلك ويوم عليك","خليها على الله","الدنيا ما تسوى الزعل","نضحك ونعيشها عيني 😂"],
"حظ":["الحظ يحتاج شوية شغل 😎","إن شاء الله حظك اليوم قوي","لا تعتمد على الحظ وحده","يمكن نغنوغ يجيبلك الحظ 😂"],
"فلوس":["الفلوس تجي وتروح","يا ريت نغنوغ يوزع 😂","الله يرزق الجميع","الفلوس حلوة بس راحة البال أحلى"],
"شغل":["الله يقويك بالشغل","شد حيلك عيني","الشغل شغل، والسوالف بعده 😂","رزقك على الله"],
"دراسة":["شد حيلك يا طالب","الدراسة مستقبل عيني","ذاكر وبعدين تعال سولف 😂","الله يوفقك بدراستك"],
"امتحان":["الله يوفقك بالامتحان","اقرأ زين ولا تعتمد على الحظ 😂","إن شاء الله سهل","شد حيلك، النجاح ينتظرك"],
"نجحت":["ألف مبروك يا بطل 🎉","عاشت إيدك، تستاهل","فخر والله 😎","من نجاح لنجاح"],
"آسف":["مقبولة عيني ❤️","ولا يهمك، تصير","خلصت السالفة","سامحتك، بس لا تعيدها 😂"],
"سامحني":["مسامحك يا غالي","تم العفو 😄","ماكو شي بينا","مقبولة، بس انتبه بعد"],
"غلط":["كلنا نغلط عيني","تعلم منها وخلاص","الغلط يصير، المهم تصلحه","ولا يهمك ❤️"],
"صح":["صح لسانك","بالضبط عيني","كلام مضبوط 😎","هاي المرة جبتها صح 😂"],
"صدق":["إي والله صدگ","صدگ وبدون لف ودوران","الحچي الصريح أحلى","نغنوغ ما يعرف المجاملة 😂"],
"احچي":["احچي عيني، نسمعك","تدلل سولف","المايك إلك 🎤","هاات السالفة من البداية"],
"اسكت":["هاا تريد تسكت نغنوغ؟ 😂","حاضر بس دقيقة","نغنوغ ما يعرف يسكت 😏","تمام، نراقب بصمت"],
"كافي":["حاضر كافي 😂","تمام، نهدأ شوية","كافي؟ ليش السالفة حلوة","أمرك عيني"],
"بعد":["بعد شنو؟ 😂","تدلل بعدنا بالبداية","بعدنا نريد سوالف","هاا كمل لا توقف"],
"يلا":["يلا بينا 😎","هيا نتحرك","يلا لا تتأخر","يلا، اللمة تنتظر"],
"باوع":["باوع عيني 👀","أباوع، شكو؟","شايفك، احچي","هاا خل نشوف شنو عندك 😂"],
"اسمع":["سامعك عيني","آمر، أذني إلك","احچي وأنا أسمع","نغنوغ مركز وياك 😎"],
"فهمت":["عاشت، وصلت الفكرة","كفو عليك","تمام، هسه نكمل","زين فهمت، لا ترجع تسألني 😂"],
"مافهمت":["أعيدها إلك عيني","ولا يهمك، نشرحها أبسط","تعال من البداية","هالمرة أوضحها بدون فلسفة 😂"],
"حلوة":["الأحلى ذوقك","حلوة بوجودكم","هاا خوش ذوق 😏","عاشت الحلوة إذا تقصد السالفة 😂"],
"قوي":["قوي بالله 😎","هذا الحچي","كفو، مستوى عالي","قوي بس لا تتكبر علينا 😂"],
"بطل":["إنت البطل الحقيقي","عاشت إيدك يا بطل 🏆","بطل وتستاهل","نغنوغ يسجلها إلك 😂"],
"أسطورة":["الأسطورة وصل 😎","لا ترفع سقف التوقعات 😂","أسطورة من أهل اللمة","تاج راسنا يا أسطورة"],
"زاحف":["هاا زحف شنو؟ 😂","نغنوغ كاشف الزحف 👀","خليها سوالف محترمة عيني","الزحف يحتاج تصريح من نغنوغ 😂"],
"غزل":["هاا بدأ الغزل 😂","غزل خفيف وبلا مشاكل","جيب كلام حلو بس محترم 😏","نغنوغ يراقب الشعراء"],
"قلب":["القلب إلك ❤️","يا بعد القلب","خلي قلبك مرتاح","القلب الطيب يكسب دائماً"],
"ورد":["الورد إنت 🌹","يا وردة اللمة","الورد للناس الطيبة","خوش ذوق، وردنا كله إلك"],
"عسل":["العسل حچيّك","يا عسل 😂","من ذوقك يا حلو","نغنوغ يريد من هالعسل شوي 😏"],
"قمر":["القمر موجود باللمة 🌙","هاا شنو هالمدح؟ 😂","قمر بعيونكم","خليها على الله يا شاعر"],
"حبي":["حبيب الگلب","تدلل يا حبي","يا بعد حبي","هلا بحبي، شكو؟"],
"اشتقت":["الشوگ متبادل ❤️","وين هالغيبة؟","اشتقنالك أكثر","تعال للمة وخلي الشوگ يروح"],
"سلامتك":["الله يسلمك ويحفظك","تسلم عيني","سلامتك من كل شر","ربي يديم عليك العافية"],
"شفاء":["الله يشافي الجميع","شفاء تام إن شاء الله","يا رب العافية","الله يبعد المرض عنكم"],
"دعاء":["آمين يا رب","الله يسمع منك","ربي يتقبل دعاءك","آمين، ولك بالمثل ❤️"],
"جمعة":["جمعة مباركة ❤️","جمعتكم خير وبركة","الله يجعلها جمعة طيبة","جمعة حلوة ويا أهل اللمة"],
"رمضان":["رمضان كريم 🌙","الله يبلغنا رمضان بالخير","رمضان شهر الخير","كل عام وأنتم بخير"],
"عيد":["عيدكم مبارك 🎉","كل عام وأنتم بخير","ينعاد عليكم بالصحة","عيد وفرحة يا رب"],
"سنة":["سنة خير إن شاء الله","يا رب سنة حلوة","كل عام وإنت بخير","سنة جديدة، سوالف جديدة 😂"],
"صديق":["الصديق وقت الضيق","ونعم بالصديق الوفي","الصداقة رزق","خوش صديق اللي يبقى وقت الشدة"],
"رفيق":["ونعم الرفيق","الرفيق الطيب نعمة","خوش رفيق يا غالي","الرفقة الزينة تسوى هواية"],
"أخوي":["هلا بأخوي الغالي","تدلل أخوي","على راسي أخوي","إنت أخو عزيز ❤️"],
"أختي":["هلا بأختنا الغالية","تدللين أختي","على راسي أختي","الله يحفظج ويونسج"],
"أهل":["الأهل عزوة","الله يحفظ الأهل","الأهل تاج الراس","ربي يديم جمعتكم ❤️"],
"أمي":["الله يحفظ الأمهات ❤️","الأم تاج الراس","ربي يديمها نعمة","الله يطول بعمر الأمهات"],
"أبوي":["الله يحفظ الآباء","الأب سند","ربي يديمه فوق الراس","الأب عزوة وسند"],
"وطن":["العراق وطنّا ❤️🇮🇶","الوطن على الراس","ربي يحفظ بلدنا","العراق يبقى بالقلب"],
"شكو":["شكو ماكو؟ 😂","ماكو غير الخير","إنت شكو عندك؟","كلشي هادي هسه 😎"],
"هواية":["هواية والله 😂","إي هواية مو شوية","هواية حچي بعدنا","هواية؟ خلي نعدها 😏"],
"مو":["مو شنو؟ وضحلي 😂","مو مشكلة عيني","مو؟ هاي بداية السالفة","تمام، فهمنا مو 😄"],
"تره":["تره أدري بيك 😂","تره نغنوغ حاضر","تره لا تسويها","هاا تره شنو؟"],
"ولك":["ها ولك شبيك 😂","ولك حبيبي هديها","آمر ولك","ولك اللمة تسمعك 😎"],
"تعب":["الله يعينك على التعب","ارتاح شوية عيني","التعب يروح والراحة تجي","شد حيلك وبعدين ارتاح"],
"نجوم":["النجوم بالسماء والنجوم باللمة ⭐","إنت نجمنا اليوم","نغنوغ يحب النجوم 😎","هلا بنجم اللمة"],
"ممنون":["العفو يا غالي","تدلل، هذا واجبنا","ممنون من ذوقك","ولا يهمك عيني"],
"عيني":["عيوني إلك","تدلل عيني","هاا آمر عيني","العين ما تغلى عليك"],
"عمري":["عمرك طويل يا غالي","تدلل يا بعد عمري","الله يحفظك","هلا بعمر اللمة"],
"تعيش":["تعيش وتدوم","تعيش عيني","الله يطول عمرك","تعيش وتجيب غيرها 😂"],
"ونعم":["ونعم منك","ونعم بأصلك","ونعم والله","تاج الراس يا ابن الأصول"],
"مرحبتين":["مرحبتين وثلاث 🌹","يا هلا بالطيب","مرحبتين بأهل اللمة","نورتنا مرتين 😂"],
"هلاوات":["هلاوات بيك 😎","هلا مليون","هلا وغلا يا غالي","هلاوات من هنا لباجر 😂"],
"تدلل":["تدلل عيني","إنت تأمر أمر","من عيوني","بالخدمة يا غالي"],
"تأمر":["آمرني بس","من عيوني","تدلل، شتريد؟","أمر تدلل"],
"بالخدمة":["تسلم، ونعم منك","كلنا بالخدمة","تدلل عيني","هذا واجبنا"],
"أحسنت":["أحسنت إنت بعد","عاشت إيدك","كفو، حچي مضبوط","من ذوقك يا بطل"],
"تعيش":["تعيش وتدوم","الله يطول عمرك","تعيش عيني","تعيش وتفرح دائماً"],
"يا هلا":["يا هلا بيك أكثر","هلا وغلا","نورت اللمة","يا هلا بأهل الطيب"],
"منور":["النور نورك","منورين بوجودك","اللمة منورة بأهلها","منور يا غالي"],
"منورة":["منورة بأهلها 🌹","النور نورج","منورة اللمة","هلا بالنور كله"],
"أهلين":["أهلين وسهلين","يا هلا بأهلين","أهلين بيك عيني","نورتنا"],
"يا بعدهم":["يا بعد گلبي إنت","بعدهم كلهم؟ 😂","تدلل يا بعدهم","هلا بالذوق"],
"شلون الأوضاع":["ماشية والحمدلله","الأوضاع تحتاج چاي 😂","كلشي تمام حالياً","نسولف ونخليها تمشي 😎"]
};
const random=a=>a[Math.floor(Math.random()*a.length)], isGroup=c=>['group','supergroup'].includes(c?.type), name=u=>[u.first_name,u.last_name].filter(Boolean).join(' ')||'حبيبنا';
async function admin(ctx,id=ctx.from.id){try{const m=await ctx.api.getChatMember(ctx.chat.id,id);return ['creator','administrator'].includes(m.status)||id===OWNER}catch{return id===OWNER}}
async function info(ctx,u){const m=member(ctx.chat.id,u.id),un=u.username?'@'+u.username:'ما عنده معرف';let p;try{const x=await ctx.api.getUserProfilePhotos(u.id,{limit:1});if(x.total_count)p=x.photos[0].at(-1).file_id}catch{}const t=`👤 معلومات ${name(u)}\n🆔 الايدي: ${u.id}\n🔖 المعرف: ${un}\n💬 رسائله: ${m.messages}\n🏆 نقاط ألعابه: ${m.points}\n⚠️ إنذاراته: ${m.warnings}`;return p?ctx.replyWithPhoto(p,{caption:t}):ctx.reply(t)}
async function punish(ctx,id,kind,mins=30){const until=Math.floor(Date.now()/1000)+mins*60;if(kind==='ban')return ctx.api.banChatMember(ctx.chat.id,id,{until_date:until});if(kind==='kick'){await ctx.api.banChatMember(ctx.chat.id,id);return ctx.api.unbanChatMember(ctx.chat.id,id)}return ctx.api.restrictChatMember(ctx.chat.id,id,{until_date:until,permissions:{can_send_messages:false}})}
async function issueWarn(ctx,u,why='مخالفة القوانين'){const n=warn(ctx.chat.id,u.id),s=settings(ctx.chat.id),limit=s.maxwarn||3;logAdmin(ctx.chat.id,ctx.from.id,'إنذار',u.id,why);await ctx.reply(`⚠️ ها حبيبي ${name(u)}، ${why}. هذا إنذارك ${n}/${limit}`);if(n>=limit){try{await punish(ctx,u.id,s.punishment||'mute',s.duration||30);resetWarnings(ctx.chat.id,u.id);await ctx.reply('خلص حبيبي، تطبقت العقوبة وصفرنا الإنذارات حتى تبدي من جديد ❤️')}catch{await ctx.reply('ما كدرت أطبق العقوبة، تأكد عندي صلاحيات مشرف.')}}}
const safeJson=(v,fallback=[])=>{try{const x=JSON.parse(v||'null');return Array.isArray(x)?x:fallback}catch{return fallback}};
function normalizeAnswer(v){return (v||'').toLowerCase().replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[،.!؟?\s]/g,'').trim()}
async function startGame(ctx,type='mean',again=false){const chat=ctx.chat.id;const active=currentGame(chat);if(active?.active&&!again)return ctx.reply('نغنوغ يكول: التحدي شغال، جاوبوا بسرعة! 😎');let answer,prompt,shown;if(type==='mean'){const q=random(quiz);answer=q[2][Math.floor(Math.random()*q[2].length)];prompt=q[1];shown=q[0];}else{answer=random(dismantleWords);prompt=answer;shown=answer;}game(chat,true,answer,shown,type);setTimeout(()=>{const now=currentGame(chat);if(now?.active&&now.prompt===shown&&now.game_type===type){game(chat,false);bot.api.sendMessage(chat,'نغنوغ يكول: خلص وقت التحدي 😅 محد فاز هالمرة، اكتبوا نرى اخرى معاني أو تفكيك.').catch(()=>{});}},60000);return ctx.reply(type==='mean'?`🧠 نغنوغ | لعبة معاني\n\nأسرع واحد يعرف معنى [${shown}] يربح 2🏆`:`🔤 نغنوغ | لعبة تفكيك\n\nأسرع واحد يفكك الكلمة [${shown}] يربح 2🏆`)}
async function startMeanGame(ctx){return startGame(ctx,'mean')}
const lockMap={'الروابط':'links','الصور':'photos','الفيديو':'videos','الوسائط':'media','الصوتيات':'audio','الملصقات':'stickers','التحويل':'forward','التكرار':'repeat'};
function securityKeyboard(s){const labels=[['links','الروابط'],['photos','الصور'],['videos','الفيديو'],['media','الوسائط'],['audio','الصوتيات'],['stickers','الملصقات'],['forward','التحويل'],['repeat','التكرار']];const kb=new InlineKeyboard();for(let i=0;i<labels.length;i+=2){for(const [k,l] of labels.slice(i,i+2))kb.text(`${s.locks[k]?'🔒':'🔓'} ${l}`,`cfg:toggle:${k}`);kb.row()}kb.text('⬅️ رجوع','cfg:home');return kb;}
function warningKeyboard(s){return new InlineKeyboard().text(`الإنذارات: ${s.maxwarn||3}`,'cfg:noop').row().text('2 إنذار','cfg:max:2').text('3 إنذارات','cfg:max:3').text('5 إنذارات','cfg:max:5').row().text('كتم','cfg:punish:mute').text('طرد','cfg:punish:kick').text('حظر','cfg:punish:ban').row().text('مدة 10 د','cfg:duration:10').text('30 د','cfg:duration:30').text('60 د','cfg:duration:60').row().text('⬅️ رجوع','cfg:home');}
const commands=`📋 أوامر نغنوغ — دليل سريع

🛡️ الحماية
• قفل الروابط / فتح الروابط
• قفل الصور / فتح الصور
• قفل الفيديو / فتح الفيديو
• قفل الوسائط / فتح الوسائط
• قفل الصوتيات / فتح الصوتيات
• قفل الملصقات / فتح الملصقات
• قفل التحويل / فتح التحويل
• قفل التكرار / فتح التكرار
• تفعيل مكافحة البوتات / تعطيل مكافحة البوتات
• تفعيل فلترة الكلمات / تعطيل فلترة الكلمات
• فلترة كلمة / الغاء فلترة كلمة / الكلمات الممنوعة
• خدمات المجموعة تشغيل / خدمات المجموعة ايقاف
• حالة الحماية
• قفل المجموعة / فتح المجموعة

⚠️ الإدارة
• معلومات — بالرد على العضو
• انذار — بالرد
• كتم — بالرد
• طرد — بالرد
• حظر — بالرد
• الغاء كتم — بالرد
• تصفير الانذارات — بالرد
• عدد الانذارات 3
• عقوبة الانذارات كتم
• مدة العقوبة 30

📋 الإدارة المتقدمة
• سجل الادارة
• احصائيات المجموعة
• تنظيف 20 — بالرد على رسالة
• بلاغ — بالرد على الرسالة
• حالة البوت
• اضف رد الكلمة | الرد الأول | الرد الثاني
• ردودي
• حذف رد رقم
• تفعيل الترحيب / تعطيل الترحيب

🎮 الترفيه
• توب — معاني — تفكيك — العاب
• نرى اخرى معاني / نرى اخرى تفكيك

🔒 الاشتراك الإجباري و📣 الإذاعة العامة تتم إدارتها من لوحة مالك نغنوغ فقط.`;
function ownerKeyboard(){return new InlineKeyboard().text('📊 إحصائيات البوت','own:stats').row().text('📣 الإذاعة العامة','own:broadcast').text('🔒 الاشتراك الإجباري','own:channels').row().text('🏘️ المجموعات','own:groups').text('👥 المستخدمون','own:users').row().text('🚩 البلاغات','own:reports').text('✉️ مراسلة','own:dm').row().text('🔄 تحديث','own:home');}
function mainKeyboard(isOwner=false){const rows=[[{text:'➕ اضفني للمجموعة'},{text:'🏘️ مجموعاتي'}],[{text:'⚙️ الإعدادات'},{text:'🛡️ الحماية'}],[{text:'💬 الردود التلقائية'},{text:'❓ المساعدة'}]];if(isOwner)rows.push([{text:'👑 لوحة المالك'}]);return {keyboard:rows,resize_keyboard:true,is_persistent:true,input_field_placeholder:'اختار من القائمة أو اكتب أمراً'};}
function groupMenuKeyboard(groups,action='settings'){const kb=new InlineKeyboard();for(const g of groups)kb.text(g.title||String(g.id),`ucfg:${g.id}:${action}`).row();return kb;}
function ownerReplyKeyboard(){return {keyboard:[[{text:'📊 إحصائيات البوت'},{text:'📣 الإذاعة العامة'}],[{text:'🔒 الاشتراك الإجباري'},{text:'🏘️ المجموعات'}],[{text:'👥 المستخدمون'},{text:'🚩 البلاغات'}],[{text:'✉️ مراسلة'},{text:'🔄 تحديث اللوحة'}],[{text:'🏠 القائمة الرئيسية'}]],resize_keyboard:true,is_persistent:true};}
function mainText(isOwner=false){return `🤖 نغنوغ 🇮🇶\nهلا بيك، آني نغنوغ مساعد اللمة!\nاختار شتريد من الأزرار جوّه 👇${isOwner?'\n\n👑 حساب المالك مفعل.':''}`;}
function ownerPanel(ctx){return ctx.reply('🤖 نغنوغ 🇮🇶\n\nهلا بالمالك 👑\nهاي لوحة التحكم الخاصة بنغنوغ.\nمن هنا تدير البوت، الإذاعة، والاشتراك الإجباري.\n\nاختار القسم:',{reply_markup:ownerReplyKeyboard()});}
bot.command('start',async ctx=>{user(ctx.from);if(ctx.chat.type==='private'){const me=await ctx.api.getMe();return ctx.reply(mainText(ctx.from.id===OWNER),{reply_markup:mainKeyboard(ctx.from.id===OWNER)});}return ctx.reply('هلا بيكم عيني ❤️ آني نغنوغ، ضيفوني وارفعوني مشرف حتى أحمي اللمة.');});
bot.command('owner',ctx=>{user(ctx.from);if(ctx.chat.type!=='private'||ctx.from.id!==OWNER)return ctx.reply('هاي اللوحة للمالك بس عيني، افتح الخاص وياي.');return ownerPanel(ctx)});
bot.command('مراسلة',ctx=>{if(ctx.from.id!==OWNER)return ctx.reply('هاي للمالك بس.');const id=Number(ctx.match);if(!id)return ctx.reply('اكتب: /مراسلة 123456789');ownerState.set(ctx.from.id,{mode:'dm',target:id});return ctx.reply('دز نص الرسالة هسه، ولازم المستخدم يكون فاتح البوت من قبل.');});
bot.command('حذف_قناة',ctx=>{if(ctx.from.id!==OWNER)return ctx.reply('هاي للمالك بس.');const id=Number(ctx.match);if(!id)return ctx.reply('اكتب /حذف_قناة رقم');removeMandatoryChannel(id);return ctx.reply('إذا الرقم موجود انحذفت القناة.');});
bot.on('my_chat_member',async ctx=>{if(!isGroup(ctx.chat))return;const status=ctx.myChatMember.new_chat_member.status;if(['left','kicked'].includes(status)){markGroupLeft(ctx.chat.id);return;}group(ctx.chat);try{await ctx.api.sendMessage(ctx.chat.id,'هلا بأهل اللمة ❤️ ارفعوني مشرف حتى أحمي المجموعة.')}catch{}});
bot.on('chat_member',async ctx=>{const m=ctx.chatMember;if(!isGroup(ctx.chat)||m.new_chat_member.status!=='member')return;group(ctx.chat);const u=m.new_chat_member.user;const gc=groupConfig(ctx.chat.id);if(!gc.welcome)return;user(u);let photo;try{const p=await ctx.api.getUserProfilePhotos(u.id,{limit:1});if(p.total_count)photo=p.photos[0].at(-1).file_id}catch{}const d=member(ctx.chat.id,u.id);const welcome=gc.welcome_text?.trim()?gc.welcome_text.replaceAll('{name}',name(u)).replaceAll('{id}',String(u.id)).replaceAll('{username}',u.username?'@'+u.username:'بدون معرف'):random(['هلا والله بالحلو، نورت اللمة ❤️','يا هلا بالغالي، المكان صار أحلى بوجودك 🌹','نورتنا، اعتبرها مجموعتك وبين أهلك 🤍']);const t=`${welcome}\n\n👤 ${name(u)}\n🆔 ${u.id}\n🔖 ${u.username?'@'+u.username:'ما عنده معرف'}\n💬 رسائلك: ${d.messages}\n🏆 نقاط ألعابك: ${d.points}`;try{if(photo)await ctx.api.sendPhoto(ctx.chat.id,photo,{caption:t});else await ctx.api.sendMessage(ctx.chat.id,t)}catch{}});
bot.on('message',async ctx=>{const m=ctx.message,u=ctx.from,c=ctx.chat;if(!u||u.is_bot)return;user(u);if(c.type==='private'&&m.text){const t=m.text.trim();if(t==='👑 لوحة المالك'){if(u.id!==OWNER)return ctx.reply('هاي اللوحة للمالك فقط.');return ownerPanel(ctx)}if(t==='➕ اضفني للمجموعة'){const me=await ctx.api.getMe();return ctx.reply('اضغط الرابط واختار المجموعة، وبعدها ارفعني مشرف حتى أشتغل:',{reply_markup:new InlineKeyboard().url('➕ إضافة نغنوغ',`https://t.me/${me.username}?startgroup=true`)});}if(t==='🏠 القائمة الرئيسية'){return ctx.reply('رجعناك للقائمة الرئيسية عيني ❤️',{reply_markup:mainKeyboard(u.id===OWNER)});}if(t==='🏘️ مجموعاتي'){const gs=userGroups(u.id);if(!gs.length)return ctx.reply('بعد ما عندك مجموعات مسجلة وياي. ضيفني لمجموعة وخليني مشرف.');return ctx.reply('هاي مجموعاتك. اختار المجموعة:',{reply_markup:groupMenuKeyboard(gs,'settings')});}if(['⚙️ الإعدادات','🛡️ الحماية','💬 الردود التلقائية','⚠️ الإنذارات','👋 الترحيب','👥 الأعضاء','📋 سجل الإدارة','🎮 الألعاب والنقاط','🧰 أدوات متقدمة'].includes(t)){const gs=userGroups(u.id);if(!gs.length)return ctx.reply('ما لكيت مجموعات مسجلة إلك. ضيفني لمجموعة وخليني مشرف.');const map={'⚙️ الإعدادات':'settings','🛡️ الحماية':'security','💬 الردود التلقائية':'replies','⚠️ الإنذارات':'warnings','👋 الترحيب':'welcome','👥 الأعضاء':'members','📋 سجل الإدارة':'logs','🎮 الألعاب والنقاط':'games','🧰 أدوات متقدمة':'advanced'};return ctx.reply('اختار المجموعة حتى أفتح القسم من الخاص:',{reply_markup:groupMenuKeyboard(gs,map[t])});}if(u.id===OWNER&&t==='🔄 تحديث اللوحة')return ownerPanel(ctx);if(u.id===OWNER&&t==='📊 إحصائيات البوت'){const x=stats();return ctx.reply(`📊 إحصائيات البوت\n👥 المستخدمون: ${x.users}\n🏘️ المجموعات النشطة: ${x.groups}\n🚩 البلاغات الجديدة: ${x.reports}`,{reply_markup:ownerReplyKeyboard()});}if(u.id===OWNER&&t==='📣 الإذاعة العامة'){ownerState.set(u.id,{mode:'broadcast'});return ctx.reply('📣 دز رسالة الإذاعة هسه:',{reply_markup:ownerReplyKeyboard()});}if(u.id===OWNER&&t==='🔒 الاشتراك الإجباري'){return ctx.reply('🔒 إدارة الاشتراك الإجباري:',{reply_markup:new InlineKeyboard().text('➕ إضافة قناة','own:addchannel').row().text('📋 عرض القنوات','own:channels')});}if(u.id===OWNER&&t==='🏘️ المجموعات'){const list=groups();return ctx.reply(list.length?`🏘️ المجموعات المسجلة\n\n${list.map(x=>`• ${x.title||'مجموعة'} — ${x.id}`).join('\n')}`:'ماكو مجموعات.',{reply_markup:ownerReplyKeyboard()});}if(u.id===OWNER&&t==='👥 المستخدمون'){const list=users();return ctx.reply(list.length?`👥 المستخدمون\n\n${list.map(x=>`• ${x.name||'بدون اسم'} — ${x.id}`).join('\n')}`:'ماكو مستخدمين.',{reply_markup:ownerReplyKeyboard()});}if(u.id===OWNER&&t==='🚩 البلاغات'){const list=pendingReports();return ctx.reply(list.length?`🚩 عندك ${list.length} بلاغات جديدة. افتح لوحة المالك لمراجعتها.`:'🚩 ماكو بلاغات جديدة.',{reply_markup:ownerReplyKeyboard()});}if(u.id===OWNER&&t==='✉️ مراسلة'){ownerState.set(u.id,{mode:'dm_target'});return ctx.reply('دز Telegram ID للمستخدم:',{reply_markup:ownerReplyKeyboard()});}if(t==='❓ المساعدة')return ctx.reply('🤖 نغنوغ — إدارة وحماية المجموعة\n\n1️⃣ ضيفني للمجموعة وارفعني مشرف.\n2️⃣ افتح «مجموعاتي» واختار المجموعة.\n3️⃣ من الإعدادات تگدر تضبط الحماية والإنذارات والترحيب والردود.\n\n🛡️ للحماية: قفل الروابط، قفل الصور، قفل الفيديو وغيرها.\n⚠️ للإدارة: انذار، كتم، طرد، حظر، الغاء كتم.\n📋 للمساعدة: اكتب «الاوامر».\n\nنغنوغ حاضر يحافظ على اللمة ❤️');}const pending=ownerState.get(u.id);if(!isGroup(c)&&pending?.mode==='add_reply'&&m.text){const parts=m.text.split('|').map(x=>x.trim()).filter(Boolean);if(parts.length<2)return ctx.reply('الصيغة ناقصة. استخدم: الكلمة | الرد الأول | الرد الثاني');addReply(pending.chat,parts[0],parts.slice(1));ownerState.delete(u.id);return ctx.reply('✅ انضاف الرد وصار شغال بالمجموعة.');}if(!isGroup(c)&&pending?.mode==='del_reply'&&m.text){const id=Number(m.text.trim());if(!Number.isInteger(id)||id<=0)return ctx.reply('دز رقم الرد فقط.');removeReply(pending.chat,id);ownerState.delete(u.id);return ctx.reply('✅ إذا الرد موجود انحذف.');}if(!isGroup(c)&&u.id===OWNER&&pending?.mode==='dm_target'&&m.text){const target=Number(m.text.trim());if(!Number.isSafeInteger(target)||target<=0)return ctx.reply('هذا مو ID صحيح. دز الرقم فقط.');ownerState.set(u.id,{mode:'dm',target});return ctx.reply(`تمام، دز نص الرسالة للمستخدم ${target}.`)}if(!isGroup(c)&&u.id===OWNER&&pending?.mode==='channel'&&m.text){const parts=m.text.trim().split(/\s+/);const channel=parts[0];const invite=parts[1]||(channel.startsWith('@')?`https://t.me/${channel.slice(1)}`:channel);if(!channel)return ctx.reply('دز معرف القناة مثل @MyChannel.');if(mandatoryChannels().some(x=>x.chat_id===channel))return ctx.reply('⚠️ هاي القناة مضافة من قبل.');try{const ch=await ctx.api.getChat(channel);const me=await ctx.api.getMe();const bm=await ctx.api.getChatMember(ch.id,me.id);if(!['administrator','creator'].includes(bm.status))return ctx.reply('⚠️ لازم ترفع نغنوغ مشرف بالقناة حتى يگدر يتحقق من الاشتراك.');addMandatoryChannel(String(ch.id),invite);ownerState.delete(u.id);return ctx.reply(`✅ انضافت ${ch.title||channel} للاشتراك الإجباري.\n\nهسه أي عضو بالمجموعات لازم يكمل الاشتراك حتى يگدر يحچي.`)}catch{return ctx.reply('⚠️ ما كدرت أوصل للقناة. تأكد من المعرف وأن نغنوغ مضاف ومشرف بيها.')}}if(!isGroup(c)&&u.id===OWNER&&pending?.mode==='broadcast'&&m.text){ownerState.delete(u.id);let sent=0,failed=0;for(const id of destinations()){let ok=false;for(let attempt=0;attempt<2&&!ok;attempt++){try{await ctx.api.sendMessage(id,m.text);ok=true;sent++;}catch(e){const wait=Number(e?.parameters?.retry_after||0);if(wait>0)await new Promise(r=>setTimeout(r,(wait+1)*1000));}}if(!ok)failed++;await new Promise(r=>setTimeout(r,45));}return ctx.reply(`📣 خلصت الإذاعة\n\n✅ وصلت: ${sent}\n⚠️ ما وصلت: ${failed}`)}if(!isGroup(c)){if(u.id===OWNER&&pending?.mode==='dm'&&m.text){ownerState.delete(u.id);try{await ctx.api.sendMessage(Number(pending.target),`📩 رسالة من إدارة نغنوغ:\n\n${m.text}`);return ctx.reply('وصلت الرسالة عيني ❤️')}catch{return ctx.reply('ما كدرت أوصلها. لازم المستخدم يكون فاتح البوت من قبل.')}}return;}group(c);
const gcPre=groupConfig(c.id);
if(m.new_chat_members||m.left_chat_member){if(!gcPre.service_messages){try{await ctx.deleteMessage()}catch{}}else if(m.new_chat_members&&gcPre.anti_bot){for(const nu of m.new_chat_members){if(nu.is_bot){try{await ctx.api.banChatMember(c.id,nu.id);logAdmin(c.id,u.id,'حظر بوت تلقائياً',nu.id,'مكافحة البوتات')}catch{}}}}return;}
const text=(m.text||'').trim(),s=settings(c.id);let adm=await admin(ctx);
if(!adm){for(const ch of mandatoryChannels()){let joined=false;try{const cm=await ctx.api.getChatMember(ch.chat_id,u.id);joined=['member','administrator','creator'].includes(cm.status)}catch{}if(!joined){try{await ctx.deleteMessage()}catch{}return ctx.api.sendMessage(c.id,'🔒 عيني، حتى تگدر تحچي بالمجموعة لازم تشترك بالقناة المطلوبة أولاً.',{reply_markup:new InlineKeyboard().url('📢 اشترك بالقناة',ch.invite).row().text('🔄 تحقق من الاشتراك','force:check')});}}}
message(c.id,u.id);
const gcNow=groupConfig(c.id);if(!adm&&gcNow.anti_flood){const fk=`${c.id}:${u.id}`,now=Date.now(),arr=(floodState.get(fk)||[]).filter(t=>now-t<8000);arr.push(now);floodState.set(fk,arr);if(arr.length>=6){floodState.set(fk,[]);try{await ctx.deleteMessage()}catch{}return issueWarn(ctx,u,'إرسال رسائل بسرعة عالية (إغراق)');}}
const cfg=groupConfig(c.id);
if(!adm&&cfg.word_filter){const hay=[m.text,m.caption].filter(Boolean).join(' ').toLowerCase();const bad=blockedWords(c.id).find(x=>x.word&&hay.includes(x.word.toLowerCase()));if(bad){try{await ctx.deleteMessage()}catch{}return issueWarn(ctx,u,`استخدام كلمة ممنوعة: ${bad.word}`);}}
if(gcNow.auto_replies&&text&&!text.startsWith('/')&&!text.startsWith('قفل ')&&!text.startsWith('فتح ')){const norm=normalizeAnswer(text);const custom=listReplies(c.id).find(r=>{const tr=normalizeAnswer(r.trigger);return tr&&(norm===tr||norm.includes(tr))});const key=Object.keys(replies).find(k=>normalizeAnswer(k)===norm);if(custom||key){const rk=custom?safeJson(custom.responses):replies[key];const cooldownKey=`${c.id}:${u.id}:${custom?custom.id:key}`;const last=lastMessages.get(cooldownKey)||0;if(Date.now()-last>3000){lastMessages.set(cooldownKey,Date.now());return ctx.reply(random(rk));}}}const activeGame=currentGame(c.id);if(activeGame?.active&&text&&normalizeAnswer(text)===normalizeAnswer(activeGame.answer)){points(c.id,u.id,2);game(c.id,false);return ctx.reply(`عفية عليك ${name(u)}! سبقت الكل وربحت 2🏆\nنغنوغ يفتخر بيك 😎`)}
if(text==='اعدادات المجموعة'&&adm)return ctx.reply('⚙️ إعدادات نغنوغ\n\nاختار القسم اللي تريد تضبطه:',{reply_markup:new InlineKeyboard().text('🛡️ الحماية',`ucfg:${c.id}:security`).row().text('⚠️ الإنذارات',`ucfg:${c.id}:warnings`).text('👋 الترحيب',`ucfg:${c.id}:welcome`).row().text('💬 الردود التلقائية',`ucfg:${c.id}:replies`).text('👥 الأعضاء',`ucfg:${c.id}:members`).row().text('📋 سجل الإدارة',`ucfg:${c.id}:logs`).text('🎮 الألعاب والنقاط',`ucfg:${c.id}:games`)});
if(text.startsWith('اضف رد ')&&adm){const parts=text.slice(7).split('|').map(x=>x.trim()).filter(Boolean);if(parts.length<2)return ctx.reply('اكتبها هيچ عيني: اضف رد الكلمة | الرد الأول | الرد الثاني');addReply(c.id,parts[0],parts.slice(1));return ctx.reply('تم، من هسه إذا تنذكر هالكلمة أرد بالردود اللي ضفتها ❤️')}
if(text.startsWith('حذف رد ')&&adm){const id=Number(text.split(' ').at(-1));if(id>0){removeReply(c.id,id);return ctx.reply('إذا الرد موجود، انحذف عيني.')}}
if(text==='ردودي'&&adm){const a=listReplies(c.id);return ctx.reply(a.length?a.map(x=>`#${x.id} — ${x.trigger}: ${safeJson(x.responses).join(' / ')}`).join('\n'):'بعد ما ضفت ردود خاصة.');}
if(text==='الاوامر')return ctx.reply(commands);
if(text==='حالة البوت'&&adm)return ctx.reply(`🤖 نغنوغ شغال\nالمجموعة: ${c.title||c.id}\nالإنذارات: ${s.maxwarn||3}\nالعقوبة: ${{mute:'كتم',ban:'حظر',kick:'طرد'}[s.punishment||'mute']}\nالمدة: ${s.duration||30} دقيقة\nالاشتراك الإجباري: ${s.channel||'متوقف'}`);
if(text==='ا')return info(ctx,u);
if(text==='معلومات'&&m.reply_to_message?.from)return info(ctx,m.reply_to_message.from);
if(text==='توب'){const a=top(c.id);return ctx.reply(a.length?`🏆 نغنوغ | توب 10 اللمة\n${a.map((x,i)=>`${['🥇','🥈','🥉'][i]||`${i+1}.`} ${x.name||'عضو'} — ${x.points}🏆`).join('\n')}`:'بعد ما عدنا متصدرين، العبوا واجمعوا نقاط 🏆')}
if(text==='تفعيل'){await ctx.reply('نغنوغ يكول: جاري التفعيل ⏳');return ctx.reply('تم تفعيل نغنوغ ✅');}
if(text==='العاب'||text==='ألعاب')return ctx.reply('🎮 ألعاب نغنوغ\nاختار اللعبة واضغط عليها حتى تطلعلك طريقة اللعب:',{reply_markup:new InlineKeyboard().text('🧠 معاني','game:help:mean').row().text('🔤 تفكيك','game:help:break')});
if(text==='معاني')return startGame(ctx,'mean');
if(text==='تفكيك')return startGame(ctx,'break');
if(text==='نرى اخرى معاني'||text==='نريد اخرى معاني'||text==='مرة ثانية معاني')return startGame(ctx,'mean',true);
if(text==='نرى اخرى تفكيك'||text==='نريد اخرى تفكيك'||text==='مرة ثانية تفكيك')return startGame(ctx,'break',true);
if(text==='بلاغ'&&m.reply_to_message?.from){report(c.id,u.id,m.reply_to_message.from.id,m.reply_to_message.message_id);return ctx.reply('وصل البلاغ للمشرفين، تسلم عيني ❤️')}
if(!adm){const allowedLinks=groupConfig(c.id).links_allow.split(',').filter(Boolean);const linkText=[m.text,m.caption].filter(Boolean).join(' ');const hasLink=/(https?:\/\/|t\.me\/|www\.|telegram\.me\/)/i.test(linkText);const blockedLink=hasLink&&!allowedLinks.some(d=>linkText.toLowerCase().includes(d));const v=(s.locks.links&&blockedLink)?'الروابط':(s.locks.forward&&m.forward_origin)?'التحويل':(s.locks.photos&&m.photo)?'الصور':(s.locks.videos&&(m.video||m.animation||m.video_note))?'الفيديو':(s.locks.media&&(m.photo||m.video||m.document||m.animation||m.audio||m.voice||m.video_note||m.sticker))?'الوسائط':(s.locks.audio&&(m.voice||m.audio))?'الصوتيات':(s.locks.stickers&&m.sticker)?'الملصقات':null;if(v){try{await ctx.deleteMessage()}catch{}return issueWarn(ctx,u,`ممنوع ${v} بهالمجموعة`)}
if(s.locks.repeat&&text){const key=`${c.id}:${u.id}`,prev=lastMessages.get(key);if(prev===text){try{await ctx.deleteMessage()}catch{}return issueWarn(ctx,u,'ممنوع تكرار نفس الرسالة')}lastMessages.set(key,text);if(lastMessages.size>5000)lastMessages.delete(lastMessages.keys().next().value)}

}
if(text==='تفعيل مكافحة البوتات'){setGroupConfig(c.id,'anti_bot',1);logAdmin(c.id,u.id,'تشغيل مكافحة البوتات');return ctx.reply('🤖 تم تشغيل مكافحة البوتات. أي بوت يدخل للمجموعة راح ينحظر تلقائياً.');}
if(text==='تعطيل مكافحة البوتات'){setGroupConfig(c.id,'anti_bot',0);logAdmin(c.id,u.id,'إيقاف مكافحة البوتات');return ctx.reply('🤖 تم إيقاف مكافحة البوتات.');}
if(text==='تفعيل فلترة الكلمات'){setGroupConfig(c.id,'word_filter',1);return ctx.reply('🚫 تم تشغيل فلترة الكلمات الممنوعة.');}
if(text==='تعطيل فلترة الكلمات'){setGroupConfig(c.id,'word_filter',0);return ctx.reply('🚫 تم إيقاف فلترة الكلمات الممنوعة.');}
if(text.startsWith('فلترة كلمة ')&&adm){const w=text.slice('فلترة كلمة '.length).trim().toLowerCase();if(!w||w.length>50)return ctx.reply('اكتب كلمة واضحة، مثال: فلترة كلمة كلمة_ممنوعة');addBlockedWord(c.id,w);setGroupConfig(c.id,'word_filter',1);logAdmin(c.id,u.id,'إضافة كلمة ممنوعة',null,w);return ctx.reply(`🚫 انضافت «${w}» لقائمة الكلمات الممنوعة وتم تشغيل الفلترة.`);}
if(text.startsWith('الغاء فلترة كلمة ')&&adm){const w=text.slice('الغاء فلترة كلمة '.length).trim().toLowerCase();if(!w)return ctx.reply('اكتب الكلمة بعد الأمر.');removeBlockedWord(c.id,w);logAdmin(c.id,u.id,'حذف كلمة ممنوعة',null,w);return ctx.reply(`✅ انحذفت «${w}» من قائمة الكلمات الممنوعة.`);}
if(text==='الكلمات الممنوعة'&&adm){const a=blockedWords(c.id);return ctx.reply(a.length?`🚫 الكلمات الممنوعة (${a.length})\n\n${a.map((x,i)=>`${i+1}. ${x.word}`).join('\n')}`:'🚫 ماكو كلمات ممنوعة مضافة بعد.');}
if(text==='خدمات المجموعة تشغيل'&&adm){setGroupConfig(c.id,'service_messages',1);return ctx.reply('🧹 تم تشغيل رسائل الخدمة والترحيب.');}
if(text==='خدمات المجموعة ايقاف'&&adm){setGroupConfig(c.id,'service_messages',0);return ctx.reply('🧹 تم إيقاف رسائل الخدمة.');}
if(text==='حالة الحماية'&&adm){const gc=groupConfig(c.id),a=blockedWords(c.id);return ctx.reply(`🛡️ حالة حماية نغنوغ\n\n🔗 الروابط: ${s.locks.links?'مقفولة':'مفتوحة'}\n🖼️ الصور: ${s.locks.photos?'مقفولة':'مفتوحة'}\n🎬 الفيديو: ${s.locks.videos?'مقفول':'مفتوح'}\n🌊 مكافحة الإغراق: ${gc.anti_flood?'مفعّلة':'متوقفة'}\n🤖 مكافحة البوتات: ${gc.anti_bot?'مفعّلة':'متوقفة'}\n🚫 فلترة الكلمات: ${gc.word_filter?'مفعّلة':'متوقفة'} (${a.length})\n🧹 رسائل الخدمة: ${gc.service_messages?'مفعّلة':'محذوفة تلقائياً'}`);}
if(text==='تفعيل المجموعة'||text==='تفعيل الحماية'){for(const k of Object.keys(s.locks))lock(c.id,k,true);setGroupConfig(c.id,'anti_flood',1);setGroupConfig(c.id,'word_filter',1);return ctx.reply('🛡️ تم تفعيل حزمة الحماية الأساسية.');}
if(text==='تعطيل الحماية'){for(const k of Object.keys(s.locks))lock(c.id,k,false);setGroupConfig(c.id,'anti_flood',0);return ctx.reply('🔓 تم تعطيل أقفال المحتوى ومكافحة الإغراق.');}
if(!adm)return;
if(text==='سجل الادارة'||text==='سجل الإدارة'){const a=adminLogs(c.id);return ctx.reply(a.length?`📋 سجل الإدارة\n\n${a.map(x=>`• ${x.action}${x.target?` — ${x.target}`:''}${x.details?`\n  ${x.details}`:''}`).join('\n')}`:'📋 ماكو عمليات إدارية مسجلة بعد.');}
if(text==='احصائيات المجموعة'||text==='إحصائيات المجموعة'){const a=groupMembers(c.id);const total=a.reduce((n,x)=>n+x.messages,0);return ctx.reply(`📊 إحصائيات المجموعة\n\n👥 الأعضاء المسجلين: ${a.length}\n💬 الرسائل المسجلة: ${total}\n⚠️ مجموع الإنذارات: ${a.reduce((n,x)=>n+x.warnings,0)}\n🏆 مجموع نقاط الألعاب: ${a.reduce((n,x)=>n+x.points,0)}`);}
if(text==='الترحيب تشغيل'||text==='تفعيل الترحيب'){setGroupConfig(c.id,'welcome',1);return ctx.reply('👋 تم تشغيل الترحيب.');}
if(text==='الترحيب ايقاف'||text==='تعطيل الترحيب'){setGroupConfig(c.id,'welcome',0);return ctx.reply('👋 تم إيقاف الترحيب.');}
if(text.startsWith('نص الترحيب ')&&adm){const value=text.slice('نص الترحيب '.length).trim();if(!value)return ctx.reply('اكتب النص بعد الأمر. تگدر تستخدم {name} و {id} و {username}.');setGroupConfig(c.id,'welcome_text',value);setGroupConfig(c.id,'welcome',1);logAdmin(c.id,u.id,'تغيير نص الترحيب');return ctx.reply('👋 تم حفظ نص الترحيب وتشغيله.');}
if(text==='مكافحة الاغراق تشغيل'||text==='مكافحة الإغراق تشغيل'){setGroupConfig(c.id,'anti_flood',1);return ctx.reply('🛡️ تم تشغيل مكافحة الإغراق.');}
if(text==='مكافحة الاغراق ايقاف'||text==='مكافحة الإغراق إيقاف'){setGroupConfig(c.id,'anti_flood',0);return ctx.reply('🛡️ تم إيقاف مكافحة الإغراق.');}
if(text.startsWith('سماح رابط ')&&adm){const domain=text.slice('سماح رابط '.length).trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];if(!domain)return ctx.reply('اكتب الدومين، مثال: سماح رابط example.com');const list=groupConfig(c.id).links_allow.split(',').filter(Boolean);if(!list.includes(domain))list.push(domain);setGroupConfig(c.id,'links_allow',list.join(','));return ctx.reply(`🔗 تمت إضافة ${domain} لقائمة الروابط المسموحة.`);}
if(text.startsWith('منع رابط ')&&adm){const domain=text.slice('منع رابط '.length).trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];const list=groupConfig(c.id).links_allow.split(',').filter(x=>x!==domain);setGroupConfig(c.id,'links_allow',list.join(','));return ctx.reply(`🔗 تم حذف ${domain} من قائمة الروابط المسموحة.`);}
if(text.startsWith('تنظيف ')){const n=Math.min(Math.max(Number(text.split(' ').at(-1))||0,1),100);if(!m.reply_to_message?.message_id)return ctx.reply('عيني رد على آخر رسالة تريد أبدي التنظيف من بعدها.');let id=m.reply_to_message.message_id,count=0;for(let i=0;i<n;i++){try{await ctx.api.deleteMessage(c.id,id-i);count++}catch{}}logAdmin(c.id,u.id,'تنظيف رسائل',null,String(count));return ctx.reply(`🧹 تم تنظيف ${count} رسالة.`);}
if(text==='قفل المجموعة'||text==='فتح المجموعة'){try{const open=text.startsWith('فتح');await ctx.api.setChatPermissions(c.id,open?{can_send_messages:true,can_send_audios:true,can_send_documents:true,can_send_photos:true,can_send_videos:true,can_send_video_notes:true,can_send_voice_notes:true,can_send_polls:true,can_send_other_messages:true,can_add_web_page_previews:true}:{can_send_messages:false});return ctx.reply(open?'🔓 انفتحت المجموعة، رجع النشاط 😍':'🔒 انقفل الحچي بالمجموعة، هدوء شويّة 😌')}catch{return ctx.reply('ما كدرت أغير صلاحيات المجموعة، تأكد من صلاحياتي.')}}
for(const [label,key] of Object.entries(lockMap)){if(text===`قفل ${label}`||text===`فتح ${label}`){lock(c.id,key,text.startsWith('قفل'));return ctx.reply(text.startsWith('قفل')?`🔒 تم قفل ${label}، ديروا بالكم.`:`🔓 انفتح ${label}، تدللوا.`)}}
if(text==='تصفير الانذارات'&&m.reply_to_message?.from){resetWarnings(c.id,m.reply_to_message.from.id);logAdmin(c.id,u.id,'تصفير الإنذارات',m.reply_to_message.from.id);return ctx.reply('✅ تصفّرت إنذاراته، نخليها بداية جديدة ❤️')}
if(text.startsWith('عدد الانذارات ')){const n=+text.split(' ').at(-1);if(n>=1&&n<=10){set(c.id,'maxwarn',n);logAdmin(c.id,u.id,'تغيير عدد الإنذارات',null,String(n));return ctx.reply(`⚙️ تمام، الحد صار ${n} إنذارات.`)}}
if(text.startsWith('عقوبة الانذارات ')){const k=text.split(' ').at(-1),v={كتم:'mute',حظر:'ban',طرد:'kick'}[k];if(v){set(c.id,'punishment',v);logAdmin(c.id,u.id,'تغيير عقوبة الإنذارات',null,k);return ctx.reply(`⚙️ تمام، عقوبة الإنذارات صارت: ${k}.`)}}
if(text.startsWith('مدة العقوبة ')){const n=+text.split(' ').at(-1);if(n>=1&&n<=10080){set(c.id,'duration',n);logAdmin(c.id,u.id,'تغيير مدة العقوبة',null,String(n));return ctx.reply(`⏱️ مدة العقوبة صارت ${n} دقيقة.`)}}
if(['انذار','طرد','حظر','كتم','الغاء كتم'].includes(text)&&m.reply_to_message?.from){const t=m.reply_to_message.from;try{if(text==='انذار')return issueWarn(ctx,t);if(text==='طرد'){await ctx.api.banChatMember(c.id,t.id);await ctx.api.unbanChatMember(c.id,t.id);logAdmin(c.id,u.id,'طرد',t.id);return ctx.reply(`🚪 تم طرد ${name(t)} من المجموعة.`)}if(text==='حظر'){await ctx.api.banChatMember(c.id,t.id);groupBan(c.id,t.id,'حظر إداري');logAdmin(c.id,u.id,'حظر',t.id);return ctx.reply(`🚫 تم حظر ${name(t)}.`)}if(text==='كتم'){await punish(ctx,t.id,'mute',s.duration||30);logAdmin(c.id,u.id,'كتم',t.id,`${s.duration||30} دقيقة`);return ctx.reply(`🔇 تم كتم ${name(t)} لمدة ${s.duration||30} دقيقة.`)}if(text==='الغاء كتم'){await ctx.api.restrictChatMember(c.id,t.id,{permissions:{can_send_messages:true,can_send_audios:true,can_send_documents:true,can_send_photos:true,can_send_videos:true,can_send_other_messages:true}});logAdmin(c.id,u.id,'إلغاء كتم',t.id);return ctx.reply(`🔊 رجعنا صلاحية الحچي لـ ${name(t)}.`)}}catch{return ctx.reply('⚠️ ما كدرت أنفذها. تأكد أن نغنوغ مشرف وعنده الصلاحية المطلوبة.')}}
});
bot.callbackQuery(/^force:check$/,async ctx=>{const c=ctx.chat;if(!isGroup(c))return ctx.answerCallbackQuery();let missing=[];for(const ch of mandatoryChannels()){try{const cm=await ctx.api.getChatMember(ch.chat_id,ctx.from.id);if(!['member','administrator','creator'].includes(cm.status))missing.push(ch)}catch{missing.push(ch)}}if(missing.length)return ctx.answerCallbackQuery({text:`بعدك غير مشترك بـ ${missing.length} قناة.`,show_alert:true});return ctx.answerCallbackQuery({text:'✅ تمام، اشتراكك مكتمل.',show_alert:true});});
bot.callbackQuery(/^ucfg:/,async ctx=>{const [,chatRaw,action]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'الإعدادات للمشرفين فقط.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}await ctx.answerCallbackQuery();const s=settings(chat);if(action==='security')return ctx.reply('🛡️ الحماية — اضغط لتبديل القفل والفتح:',{reply_markup:new InlineKeyboard().text(`${s.locks.links?'🔒':'🔓'} الروابط`,`ucfg:${chat}:toggle:links`).row().text(`${s.locks.photos?'🔒':'🔓'} الصور`,`ucfg:${chat}:toggle:photos`).text(`${s.locks.videos?'🔒':'🔓'} الفيديو`,`ucfg:${chat}:toggle:videos`).row().text(`${s.locks.media?'🔒':'🔓'} الوسائط`,`ucfg:${chat}:toggle:media`).text(`${s.locks.audio?'🔒':'🔓'} الصوتيات`,`ucfg:${chat}:toggle:audio`).row().text(`${s.locks.stickers?'🔒':'🔓'} الملصقات`,`ucfg:${chat}:toggle:stickers`).text(`${s.locks.forward?'🔒':'🔓'} التحويل`,`ucfg:${chat}:toggle:forward`).row().text(`${s.locks.repeat?'🔒':'🔓'} التكرار`,`ucfg:${chat}:toggle:repeat`)});if(action==='toggle'){const key=ctx.callbackQuery.data.split(':')[3];lock(chat,key,!s.locks[key]);const fresh=settings(chat);return ctx.editMessageText('🛡️ الحماية — الحالة الحالية:',{reply_markup:new InlineKeyboard().text(`${fresh.locks.links?'🔒':'🔓'} الروابط`,`ucfg:${chat}:toggle:links`).row().text(`${fresh.locks.photos?'🔒':'🔓'} الصور`,`ucfg:${chat}:toggle:photos`).text(`${fresh.locks.videos?'🔒':'🔓'} الفيديو`,`ucfg:${chat}:toggle:videos`).row().text(`${fresh.locks.media?'🔒':'🔓'} الوسائط`,`ucfg:${chat}:toggle:media`).text(`${fresh.locks.audio?'🔒':'🔓'} الصوتيات`,`ucfg:${chat}:toggle:audio`).row().text(`${fresh.locks.stickers?'🔒':'🔓'} الملصقات`,`ucfg:${chat}:toggle:stickers`).text(`${fresh.locks.forward?'🔒':'🔓'} التحويل`,`ucfg:${chat}:toggle:forward`).row().text(`${fresh.locks.repeat?'🔒':'🔓'} التكرار`,`ucfg:${chat}:toggle:repeat`).row().text('⬅️ رجوع','ucfg:'+chat+':settings')});}if(action==='warnings')return ctx.reply(`⚠️ إعدادات الإنذارات\n\nالحد الحالي: ${s.maxwarn||3}\nالعقوبة: ${{mute:'كتم',ban:'حظر',kick:'طرد'}[s.punishment||'mute']}\nالمدة: ${s.duration||30} دقيقة`,{reply_markup:new InlineKeyboard().text('2️⃣ إنذارات','cfgp:'+chat+':max:2').text('3️⃣ إنذارات','cfgp:'+chat+':max:3').text('5️⃣ إنذارات','cfgp:'+chat+':max:5').row().text('🔇 كتم','cfgp:'+chat+':punish:mute').text('🚪 طرد','cfgp:'+chat+':punish:kick').text('🚫 حظر','cfgp:'+chat+':punish:ban').row().text('10 د','cfgp:'+chat+':duration:10').text('30 د','cfgp:'+chat+':duration:30').text('60 د','cfgp:'+chat+':duration:60').row().text('⬅️ رجوع','ucfg:'+chat+':settings')});if(action==='settings')return ctx.reply('⚙️ إعدادات نغنوغ\n\nاختار القسم:',{reply_markup:new InlineKeyboard().text('🛡️ الحماية',`ucfg:${chat}:security`).row().text('⚠️ الإنذارات',`ucfg:${chat}:warnings`).text('👋 الترحيب',`ucfg:${chat}:welcome`).row().text('💬 الردود التلقائية',`ucfg:${chat}:replies`).text('👥 الأعضاء',`ucfg:${chat}:members`).row().text('📋 سجل الإدارة',`ucfg:${chat}:logs`).text('🎮 الألعاب والنقاط',`ucfg:${chat}:games`).row().text('🧰 أدوات متقدمة',`ucfg:${chat}:advanced`)});if(action==='replies'){const gc=groupConfig(chat),rows=listReplies(chat);return ctx.reply(`💬 الردود التلقائية\n\nالحالة: ${gc.auto_replies?'🟢 مفعّلة':'🔴 متوقفة'}\n\n${rows.length?rows.map(x=>`#${x.id} — ${x.trigger} → ${safeJson(x.responses).join(' / ')}`).join('\n'):'ماكو ردود خاصة مضافة بعد.'}`,{reply_markup:new InlineKeyboard().text(gc.auto_replies?'🔕 إيقاف الردود':'🔔 تشغيل الردود',`ureply:toggle:${chat}`).row().text('➕ إضافة رد',`ureply:add:${chat}`).text('🗑 حذف رد',`ureply:del:${chat}`).row().text('🔄 تحديث',`ucfg:${chat}:replies`).text('⬅️ رجوع',`ucfg:${chat}:settings`)});}if(action==='members'){const a=groupMembers(chat);return ctx.reply(a.length?a.map((x,i)=>`${i+1}. ${x.name||'عضو'} — ${x.messages} رسالة — ${x.points} نقطة — ${x.warnings} إنذار`).join('\n'):'ماكو بيانات أعضاء بعد.');}if(action==='welcome'){const gc=groupConfig(chat);return ctx.reply(`👋 إعدادات الترحيب\nالحالة: ${gc.welcome?'مفعّل':'متوقف'}\nالنص الحالي: ${gc.welcome_text||'الترحيب الافتراضي'}`,{reply_markup:new InlineKeyboard().text(gc.welcome?'🔕 إيقاف الترحيب':'🔔 تشغيل الترحيب',`uwelcome:${chat}:toggle`).row().text('⬅️ رجوع',`usrgroup:${chat}`)});}if(action==='logs'){const a=adminLogs(chat);return ctx.reply(a.length?`📋 آخر عمليات الإدارة\n\n${a.map(x=>`• ${x.action}${x.target?` — ${x.target}`:''}`).join('\n')}`:'ماكو عمليات إدارية بعد.');}});
bot.callbackQuery(/^cfgp:/,async ctx=>{const [,chatRaw,action,value]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'هاي الإعدادات للمشرفين بس.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}if(action==='max')set(chat,'maxwarn',Number(value));if(action==='punish')set(chat,'punishment',value);if(action==='duration')set(chat,'duration',Number(value));await ctx.answerCallbackQuery({text:'تم الحفظ ✅'});return ctx.reply('⚠️ تم تحديث إعداد الإنذارات.',{reply_markup:new InlineKeyboard().text('⚠️ فتح إعدادات الإنذارات',`ucfg:${chat}:warnings`).text('⬅️ الإعدادات','ucfg:'+chat+':settings')});});
bot.callbackQuery(/^ureply:/,async ctx=>{const [,action,chatRaw]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'هاي الإعدادات للمشرفين بس.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}await ctx.answerCallbackQuery();if(action==='toggle'){const gc=groupConfig(chat);setGroupConfig(chat,'auto_replies',gc.auto_replies?0:1);return ctx.reply(`💬 الردود التلقائية: ${groupConfig(chat).auto_replies?'🟢 مفعّلة':'🔴 متوقفة'}`,{reply_markup:new InlineKeyboard().text('⬅️ رجوع للردود','ucfg:'+chat+':replies')});}if(action==='add'){ownerState.set(ctx.from.id,{mode:'add_reply',chat});return ctx.reply('➕ إضافة رد\n\nدزها بهذا الشكل:\nالكلمة | الرد الأول | الرد الثاني\n\nمثال:\nهلا | هلا بيك ❤️ | يا مية هلا 🌹');}if(action==='del'){ownerState.set(ctx.from.id,{mode:'del_reply',chat});return ctx.reply('🗑 دز رقم الرد المراد حذفه.');}});
bot.callbackQuery(/^pgroup:/,async ctx=>{const [,chatRaw,action]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'الإعدادات للمشرفين فقط.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}await ctx.answerCallbackQuery();return ctx.reply(`⚙️ ${action==='settings'?'إعدادات نغنوغ':action==='security'?'الحماية':action==='replies'?'الردود التلقائية':action==='warnings'?'الإنذارات':action==='welcome'?'الترحيب':action==='members'?'الأعضاء':action==='logs'?'سجل الإدارة':action==='games'?'الألعاب والنقاط':'الأدوات المتقدمة'}\n\nاختار القسم:`,{reply_markup:new InlineKeyboard().text('🛡️ الحماية',`ucfg:${chat}:security`).row().text('⚠️ الإنذارات',`ucfg:${chat}:warnings`).text('👋 الترحيب',`ucfg:${chat}:welcome`).row().text('💬 الردود التلقائية',`ucfg:${chat}:replies`).text('👥 الأعضاء',`ucfg:${chat}:members`).row().text('📋 سجل الإدارة',`ucfg:${chat}:logs`).text('🎮 الألعاب',`ucfg:${chat}:games`).row().text('🧰 أدوات متقدمة',`ucfg:${chat}:advanced`)});});
bot.callbackQuery(/^usrgroup:/,async ctx=>{const chat=Number(ctx.callbackQuery.data.split(':')[1]);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'الإعدادات للمشرفين فقط.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}await ctx.answerCallbackQuery();return ctx.reply(`⚙️ إدارة مجموعة ${chat}\n\nاختار القسم:`,{reply_markup:new InlineKeyboard().text('🛡️ الحماية',`ucfg:${chat}:security`).row().text('⚠️ الإنذارات',`ucfg:${chat}:warnings`).text('👋 الترحيب',`ucfg:${chat}:welcome`).row().text('💬 الردود التلقائية',`ucfg:${chat}:replies`).text('👥 الأعضاء',`ucfg:${chat}:members`).row().text('📋 سجل الإدارة',`ucfg:${chat}:logs`).text('🎮 الألعاب',`ucfg:${chat}:games`).row().text('🧰 أدوات متقدمة',`ucfg:${chat}:advanced`)});});
bot.callbackQuery(/^uadv:/,async ctx=>{const [,chatRaw,action]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'هاي الإعدادات للمشرفين بس.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}const gc=groupConfig(chat);if(action==='bot')setGroupConfig(chat,'anti_bot',gc.anti_bot?0:1);if(action==='filter')setGroupConfig(chat,'word_filter',gc.word_filter?0:1);if(action==='service')setGroupConfig(chat,'service_messages',gc.service_messages?0:1);if(action==='replies')setGroupConfig(chat,'auto_replies',gc.auto_replies?0:1);await ctx.answerCallbackQuery();return ctx.editMessageText('🧰 تم تحديث الأدوات المتقدمة.',{reply_markup:new InlineKeyboard().text('🧰 عرض الأدوات',`ucfg:${chat}:advanced`).row().text('⬅️ رجوع',`usrgroup:${chat}`)});});
bot.callbackQuery(/^uwelcome:/,async ctx=>{const [,chatRaw,action]=ctx.callbackQuery.data.split(':');const chat=Number(chatRaw);try{const cm=await ctx.api.getChatMember(chat,ctx.from.id);if(!['creator','administrator'].includes(cm.status))return ctx.answerCallbackQuery({text:'هاي الإعدادات للمشرفين بس.',show_alert:true});}catch{return ctx.answerCallbackQuery({text:'ما كدرت أتحقق من صلاحيتك.',show_alert:true});}setGroupConfig(chat,'welcome',groupConfig(chat).welcome?0:1);await ctx.answerCallbackQuery();return ctx.editMessageText(`👋 الترحيب: ${groupConfig(chat).welcome?'مفعّل':'متوقف'}`,{reply_markup:new InlineKeyboard().text('⬅️ رجوع',`usrgroup:${chat}`)});});
bot.callbackQuery(/^game:help:/,async ctx=>{const type=ctx.callbackQuery.data.split(':')[2];const hint=type==='mean'?'أرسل كلمة معاني وأسرع واحد يجاوب يفوز':'ارسل كلمة تفكيك وقم بفصل الاحرف';return ctx.answerCallbackQuery({text:hint,show_alert:true});});
bot.callbackQuery(/^own:/,async ctx=>{
 if(ctx.from.id!==OWNER||ctx.chat?.type!=='private')return ctx.answerCallbackQuery({text:'هاي اللوحة للمالك بس.'});
 await ctx.answerCallbackQuery();
 const bits=ctx.callbackQuery.data.split(':'); const a=bits[1];
 if(a==='home')return ctx.editMessageText('🤖 نغنوغ 🇮🇶\nلوحة تحكم المالك — اختار القسم:',{reply_markup:ownerKeyboard()});
 if(a==='resolve'){resolveReport(Number(bits[2]));return ctx.reply('✅ تم إغلاق البلاغ.');}
 if(a==='reportmute'){const [id,chat,target]=[Number(bits[2]),Number(bits[3]),Number(bits[4])];try{await ctx.api.restrictChatMember(chat,target,{until_date:Math.floor(Date.now()/1000)+1800,permissions:{can_send_messages:false}});resolveReport(id);return ctx.reply('🔇 تم كتم العضو 30 دقيقة وإغلاق البلاغ.')}catch{return ctx.reply('⚠️ ما كدرت أكتم العضو. تأكد من صلاحيات نغنوغ بالمجموعة.')}}
 if(a==='reportban'){const [id,chat,target]=[Number(bits[2]),Number(bits[3]),Number(bits[4])];try{await ctx.api.banChatMember(chat,target);resolveReport(id);return ctx.reply('🚫 تم حظر العضو وإغلاق البلاغ.')}catch{return ctx.reply('⚠️ ما كدرت أحظر العضو. تأكد من صلاحيات نغنوغ بالمجموعة.')}}
 if(a==='stats'){const x=stats();return ctx.reply(`📊 إحصائيات البوت\n👥 المستخدمون: ${x.users}\n🏘️ المجموعات النشطة: ${x.groups}\n🚩 البلاغات الجديدة: ${x.reports}`,{reply_markup:new InlineKeyboard().text('⬅️ لوحة المالك','own:home')});}
 if(a==='users'){const list=users();const body=list.length?list.map((x,i)=>`${i+1}) ${x.name||'بدون اسم'} — ${x.id}${x.username?' @'+x.username:''}`).join('\n'):'ماكو مستخدمين مسجلين بعد.';return ctx.reply(`👥 آخر المستخدمين المسجلين\n${body}\n\nللمراسلة اضغط الزر أو استخدم /مراسلة USER_ID`,{reply_markup:new InlineKeyboard().text('✉️ مراسلة مستخدم','own:dm').row().text('⬅️ رجوع','own:home')});}
 if(a==='groups'){const list=groups();const body=list.length?list.map((x,i)=>`${i+1}) ${x.title||'مجموعة'} — ${x.id}`).join('\n'):'ماكو مجموعات نشطة مسجلة.';return ctx.reply(`🏘️ المجموعات المسجلة\n${body}`,{reply_markup:new InlineKeyboard().text('⬅️ رجوع','own:home')});}
 if(a==='dm'){ownerState.set(ctx.from.id,{mode:'dm_target'});return ctx.reply('دز رقم Telegram ID للمستخدم اللي تريد تراسله:');}
 if(a==='addchannel'){ownerState.set(ctx.from.id,{mode:'channel'});return ctx.reply('دز معرف القناة مثل @MyChannel، وإذا رابط الدعوة مختلف اكتبه بعد مسافة.\nمثال: @MyChannel https://t.me/MyChannel',{reply_markup:new InlineKeyboard().text('إلغاء','own:home')});}
 if(a==='channels'){const list=mandatoryChannels();if(!list.length)return ctx.reply('ماكو قنوات اشتراك إجباري حالياً.',{reply_markup:new InlineKeyboard().text('➕ إضافة قناة','own:addchannel').row().text('⬅️ رجوع','own:home')});for(const x of list)await ctx.reply(`📢 ${x.chat_id}\nرابط الاشتراك: ${x.invite}`,{reply_markup:new InlineKeyboard().text('🗑 حذف القناة',`own:delchannel:${x.id}`)});return ctx.reply('إدارة قنوات الاشتراك:',{reply_markup:new InlineKeyboard().text('➕ إضافة قناة','own:addchannel').row().text('⬅️ رجوع','own:home')});}
 if(a==='delchannel'){removeMandatoryChannel(Number(bits[2]));return ctx.reply('تم حذف القناة من قائمة الاشتراك الإجباري.',{reply_markup:new InlineKeyboard().text('عرض القنوات','own:channels').row().text('⬅️ لوحة المالك','own:home')});}
 if(a==='broadcast'){ownerState.set(ctx.from.id,{mode:'broadcast'});return ctx.reply('📣 الإذاعة العامة\n\nدز الرسالة هسه، وأنا أوصلها للمستخدمين والمجموعات المسجلة عند نغنوغ.\n\n⚠️ الإذاعة قد تستغرق وقت حسب عدد الجهات حتى ما ننضرب بحدود Telegram.');}
 if(a==='reports'){const list=pendingReports();if(!list.length)return ctx.reply('ماكو بلاغات جديدة، اللمة هادئة 😌',{reply_markup:new InlineKeyboard().text('⬅️ رجوع','own:home')});for(const x of list)await ctx.reply(`🚩 بلاغ #${x.id}\n\n🏘️ المجموعة: ${x.chat}\n👤 المبلّغ: ${x.reporter}\n⚠️ العضو: ${x.target}\n📝 الرسالة: ${x.message}`,{reply_markup:new InlineKeyboard().text('🔇 كتم 30د',`own:reportmute:${x.id}:${x.chat}:${x.target}`).row().text('🚫 حظر',`own:reportban:${x.id}:${x.chat}:${x.target}`).text('✅ إغلاق',`own:resolve:${x.id}`)});return;}
});
bot.callbackQuery(/^cfg:/,async ctx=>{if(!isGroup(ctx.chat)||!(await admin(ctx)))return ctx.answerCallbackQuery({text:'هاي الإعدادات للمشرفين بس.'});const bits=ctx.callbackQuery.data.split(':');const action=bits[1];const chat=ctx.chat.id;let s=settings(chat);await ctx.answerCallbackQuery();if(action==='toggle'){const key=bits[2];if(!Object.hasOwn(s.locks,key))return;lock(chat,key,!s.locks[key]);s=settings(chat);return ctx.editMessageText('🛡️ إعدادات الحماية — اضغط على الخيار حتى تبدّل حالته:',{reply_markup:securityKeyboard(s)});}if(action==='max'){set(chat,'maxwarn',Number(bits[2]));s=settings(chat);return ctx.editMessageText(`⚠️ عدد الإنذارات قبل العقوبة: ${s.maxwarn}`,{reply_markup:warningKeyboard(s)});}if(action==='punish'){set(chat,'punishment',bits[2]);s=settings(chat);return ctx.editMessageText(`⚠️ تم اختيار العقوبة: ${{mute:'كتم',kick:'طرد',ban:'حظر'}[s.punishment]}`,{reply_markup:warningKeyboard(s)});}if(action==='duration'){set(chat,'duration',Number(bits[2]));s=settings(chat);return ctx.editMessageText(`⏱️ مدة العقوبة: ${s.duration} دقيقة`,{reply_markup:warningKeyboard(s)});}if(action==='noop')return;if(action==='home')return ctx.editMessageText('⚙️ اختار القسم:',{reply_markup:new InlineKeyboard().text('🛡️ الحماية','cfg:security').row().text('💬 الردود التلقائية','cfg:replies').text('⚠️ الإنذارات','cfg:warnings').row().text('👥 إحصائيات الأعضاء','cfg:members').row().text('🎮 الألعاب والنقاط','cfg:games')});if(action==='security')return ctx.editMessageText('🛡️ إعدادات الحماية — اضغط على الخيار حتى تبدّل حالته:',{reply_markup:securityKeyboard(s)});if(action==='warnings')return ctx.editMessageText('⚠️ إعدادات الإنذارات والعقوبات:',{reply_markup:warningKeyboard(s)});if(action==='members'){const a=groupMembers(chat);return ctx.reply(a.length?a.map((x,i)=>`${i+1}. ${x.name||'عضو'} — ${x.messages} رسالة — ${x.points} نقطة — ${x.warnings} إنذار`).join('\n'):'ماكو بيانات أعضاء بعد.');}if(action==='replies')return ctx.reply(`الردود الخاصة:\n${listReplies(chat).map(x=>`#${x.id} ${x.trigger}`).join('\n')||'بعد ماكو ردود خاصة.'}\n\nإضافة: اضف رد الكلمة | الرد الأول | الرد الثاني\nعرض: ردودي\nحذف: حذف رد رقم`);if(action==='games')return ctx.reply('النقاط منفصلة لكل مجموعة. اكتب العاب لبدء لعبة معاني.');if(action==='advanced'){const gc=groupConfig(chat),bw=blockedWords(chat);return ctx.reply(`🧰 أدوات متقدمة\n\n🤖 مكافحة البوتات: ${gc.anti_bot?'مفعّلة':'متوقفة'}\n🚫 فلترة الكلمات: ${gc.word_filter?'مفعّلة':'متوقفة'} — ${bw.length} كلمة\n🧹 رسائل الخدمة: ${gc.service_messages?'تظهر':'تنحذف'}\n🌊 مكافحة الإغراق: ${gc.anti_flood?'مفعّلة':'متوقفة'}`,{reply_markup:new InlineKeyboard().text(gc.anti_bot?'🔕 إيقاف البوتات':'🤖 مكافحة البوتات',`uadv:${chat}:bot`).row().text(gc.word_filter?'🔕 إيقاف الفلترة':'🚫 تشغيل الفلترة',`uadv:${chat}:filter`).text(gc.service_messages?'🧹 حذف الخدمة':'💬 إظهار الخدمة',`uadv:${chat}:service`).row().text(gc.auto_replies?'🔕 إيقاف الردود':'💬 تشغيل الردود',`uadv:${chat}:replies`).row().text('⬅️ رجوع',`ucfg:${chat}:settings`)});}});
bot.catch(e=>console.error('Bot error',e.error));bot.start({allowed_updates:['message','callback_query','my_chat_member','chat_member'],onStart:x=>console.log(`Started @${x.username}`)});
