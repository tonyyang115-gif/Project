
import React, { useState } from 'react';
import { Button } from './Button';
import { Flame, X, ShieldCheck, FileText } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const PolicyModal = ({ title, icon: Icon, content, onClose }: { title: string, icon: any, content: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
        <div className="bg-white w-full max-w-md h-[85vh] rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-lg text-gray-900">{title}</span>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 leading-relaxed space-y-6 scroll-smooth">
                {content}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-gray-50 bg-white z-20">
                <Button 
                    fullWidth 
                    size="md"
                    onClick={onClose} 
                    className="rounded-2xl bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200"
                >
                    我已阅读并知晓
                </Button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between px-8 pb-10 pt-24 relative font-sans animate-in fade-in duration-700">
      
      {/* Center Content - Push slightly up to visual center */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-24">
        {/* Logo Container - Larger and with deeper shadow as per screenshot */}
        <div className="w-32 h-32 bg-gray-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-gray-200 ring-4 ring-white">
           <Flame className="w-16 h-16 text-orange-500 fill-orange-500" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">SnapCal</h1>
        <p className="text-gray-500 text-lg font-medium tracking-wide">轻松记录，健康生活</p>
      </div>

      {/* Bottom Actions */}
      <div className="w-full space-y-6">
        <Button 
          fullWidth 
          size="lg" 
          onClick={onStart}
          disabled={!agreed}
          // Keeping Blue theme as requested ("保持当前设计的风格和色调保持不变")
          className={`h-14 text-lg font-bold rounded-full shadow-xl shadow-blue-200 transition-all transform ${
            !agreed ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          开始记录
        </Button>

        <div className="text-center">
            <button className="text-gray-900 font-bold text-sm tracking-wide active:text-gray-700 transition-colors">
                已有账号? 登录
            </button>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
           <div className="relative flex items-center">
            <input 
                type="checkbox" 
                id="agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <label htmlFor="agreement" className="text-xs text-gray-400 font-medium cursor-pointer select-none">
            我已阅读并同意 
            <span className="text-blue-600 font-bold px-1 hover:underline" onClick={(e) => { e.preventDefault(); setShowAgreement(true); }}>《用户协议》</span> 
            和 
            <span className="text-blue-600 font-bold px-1 hover:underline" onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}>《隐私政策》</span>
          </label>
        </div>
      </div>

      {/* User Agreement Modal */}
      {showAgreement && (
        <PolicyModal 
            title="用户协议" 
            icon={FileText}
            onClose={() => setShowAgreement(false)}
            content={
                <>
                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">1. 服务说明</h3>
                        <p>欢迎使用 SnapCal（以下简称"本应用"）。本应用是一款基于人工智能技术的健康管理工具，旨在辅助用户进行饮食记录、热量计算及身体数据管理。</p>
                    </section>
                    
                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">2. 健康免责声明 (重要)</h3>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-800 font-medium">
                            本应用提供的所有数据（包括但不限于食物热量、营养成分、BMI分析、身体成分估算）均为基于AI算法的估算值，仅供参考。
                        </div>
                        <p className="mt-2">本应用不提供任何医疗建议、诊断或治疗。在开始任何饮食控制计划、运动计划或改变生活方式之前，请务必咨询专业医生或注册营养师。若您有饮食失调、孕期、糖尿病或其他慢性疾病，请遵医嘱使用。</p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">3. 用户行为规范</h3>
                        <p>您承诺仅将本应用用于个人非商业用途。您不得上传含有色情、暴力、政治敏感或侵犯他人版权的图片。若发现违规内容，我们保留封禁账号的权利。</p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">4. 知识产权</h3>
                        <p>本应用的所有设计、代码、算法及界面素材归 SnapCal 开发团队所有。未经授权，不得进行反向工程或抄袭。</p>
                    </section>
                </>
            }
        />
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <PolicyModal 
            title="隐私政策" 
            icon={ShieldCheck}
            onClose={() => setShowPrivacy(false)}
            content={
                <>
                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">1. 我们收集的信息</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>身体数据</strong>：身高、体重、年龄、性别，用于计算基础代谢率和推荐热量。</li>
                            <li><strong>上传内容</strong>：您拍摄或上传的食物照片、配料表照片，仅用于AI识别分析。</li>
                            <li><strong>头像信息</strong>：您主动选择的头像（微信头像或推荐头像）用于个人资料展示与账号识别。</li>
                            <li><strong>使用记录</strong>：您的饮食打卡记录和运动记录。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">2. 数据的存储与安全</h3>
                        <p>目前版本中，您的核心个人档案数据主要存储在您设备的<strong>本地存储 (LocalStorage)</strong> 中。这意味着如果您卸载应用或清除缓存，数据可能会丢失。头像在您确认保存后会同步至云端档案；上传失败时不会保存临时路径。</p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">3. 第三方服务的使用</h3>
                        <p>为了提供智能识别功能，我们会将您上传的图片数据传输给第三方人工智能服务商（如 Google Gemini 或 Alibaba Qwen）进行处理。这些数据传输过程经过加密，且仅用于单次分析，不会用于其他商业用途。配料识别所上传的临时图片默认在分析完成后删除，最晚不超过 24 小时。</p>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">4. 权限使用说明</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>相机权限</strong>：用于拍摄食物或配料表。</li>
                            <li><strong>相册权限</strong>：用于从相册选择图片进行识别。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-base font-bold text-gray-900 mb-2">5. 联系我们</h3>
                        <p>如对本隐私政策有任何疑问，请通过应用内的"反馈"功能联系我们。</p>
                    </section>
                </>
            }
        />
      )}
    </div>
  );
};
