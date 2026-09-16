import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, BookOpen, Braces, CheckCircle2, ExternalLink, Fingerprint, GitMerge, History, Scale, ShieldCheck } from 'lucide-react';
import { WalletProvider } from './context/WalletContext';
import { RegistryProvider } from './context/RegistryContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { ClusterExplorer } from './components/ClusterExplorer';
import { ProposeAliasSet } from './components/ProposeAliasSet';
import { ProposalAssessmentTracker } from './components/ProposalAssessmentTracker';
import { FileObjection } from './components/FileObjection';
import { IncidentConsumer } from './components/IncidentConsumer';
import { TransactionModal } from './components/TransactionModal';
import { ToastContainer } from './components/ToastContainer';

type Layer = 'story' | 'workspace';

const TracefoldMark = ({ compact = false }: { compact?: boolean }) => (
  <span className={`tracefold-mark ${compact ? 'tracefold-mark--compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 52 52"><path d="M8 9h36L33 21H19L8 9Z" fill="currentColor" opacity=".95"/><path d="M19 24h14v19l-7-5-7 5V24Z" fill="currentColor"/><path d="m33 21 11-12v23L33 43V21Z" fill="currentColor" opacity=".58"/></svg>
  </span>
);

const ConsensusSeal = () => <div className="consensus-seal" aria-label="GenLayer and Tracefold in balanced consensus">
  <div className="seal-half seal-half--genlayer"><img src="/genlayer-logo.png" alt="GenLayer"/></div>
  <div className="seal-half seal-half--tracefold"><TracefoldMark/></div>
  <span className="seal-dot seal-dot--top"><TracefoldMark compact/></span>
  <span className="seal-dot seal-dot--bottom"><img src="/genlayer-logo.png" alt=""/></span>
</div>;

const Brand = () => <a href="#top" className="brand" aria-label="Tracefold home"><TracefoldMark compact/><span>TRACEFOLD</span></a>;

const Landing = ({ openWorkspace }: { openWorkspace: () => void }) => {
  useEffect(() => { document.title = 'Tracefold — Evidence-led vulnerability identity'; }, []);
  return <div id="top" className="story-layer">
    <header className="story-nav"><Brand/><nav aria-label="Main navigation"><a href="#method">Method</a><span>•</span><a href="#principles">Principles</a><span>•</span><a href="#docs">Docs</a></nav><button className="nav-launch" onClick={openWorkspace}>Open workspace <ArrowRight size={15}/></button></header>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero-image" src="/tracefold-hero.webp" alt="Two hands reaching across public security records" fetchPriority="high"/><div className="hero-vignette"/>
        <div className="hero-copy"><p className="eyebrow">VERIFIABLE VULNERABILITY IDENTITY</p><h1 id="hero-title">Different records.<br/><em>One defensible truth.</em></h1><p className="hero-lede">Tracefold asks GenLayer validators to reconcile CVE, GHSA and OSV records—then preserves the evidence, objections and decision history onchain.</p><button className="primary-cta" onClick={openWorkspace}>Trace an alias set <ArrowRight size={18}/></button></div>
        <div className="seal-position"><ConsensusSeal/></div><a className="scroll-cue" href="#method"><span>Explore the method</span><ArrowDown size={17}/></a>
        <div className="hero-proof" aria-label="Core guarantees"><span><ShieldCheck size={15}/> Conservative mutation</span><span><History size={15}/> Bounded history</span><span><Fingerprint size={15}/> Evidence fingerprint</span></div>
      </section>
      <section id="method" className="section section--paper"><div className="section-kicker">01 / THE METHOD</div><div className="split-heading"><h2>Aliases are claims.<br/>Tracefold makes them <em>reviewable.</em></h2><p>Security databases often describe the same flaw with different identifiers, packages and timelines. A wrong merge can duplicate payouts or hide exposure. Tracefold turns that uncertain comparison into a bounded public decision.</p></div><div className="method-grid">
        {[
          ['01','Propose','Submit a canonical CVE with optional GHSA and OSV identifiers. Nonces and identifier sets prevent accidental duplicate proposals.'],
          ['02','Gather','The Intelligent Contract retrieves current records from NVD, GitHub Advisory Database and OSV inside GenLayer’s nondeterministic execution boundary.'],
          ['03','Adjudicate','Independent validators compare stable consequence fields. Missing or contradictory evidence resolves conservatively instead of forcing a merge.'],
          ['04','Preserve','Outcome, source status, revisions, fingerprint, objections and bounded history remain inspectable through contract views.']
        ].map(([n,title,body]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}
      </div></section>
      <section id="principles" className="section section--ink"><div className="section-kicker">02 / BUILT FOR DISAGREEMENT</div><div className="principles-grid"><div><h2>Consensus without<br/><em>careless convergence.</em></h2><p>Tracefold keeps uncertainty visible. It never silently unites two existing clusters, and an active objection prevents a matching result from mutating cluster state.</p></div><div className="principle-cards">
        <article><Scale/><h3>Conflict stays explicit</h3><p>Competing clusters become a reviewable conflict record. Both canonical histories remain intact.</p></article><article><GitMerge/><h3>Merge only with support</h3><p>A same-vulnerability outcome needs multiple successful records and no contradictory package evidence.</p></article><article><Braces/><h3>Machine-readable proof</h3><p>Every assessment exposes stable bands, source revisions and a content fingerprint for downstream systems.</p></article>
      </div></div></section>
      <section id="docs" className="section section--docs"><div className="section-kicker">03 / FIELD GUIDE</div><div className="docs-layout"><aside><BookOpen size={28}/><h2>Read before you write.</h2><p>The public workflow is designed for researchers, maintainers and incident systems. Every consequential action requires a wallet and ends with finalized semantic execution plus authoritative readback.</p><button className="text-cta" onClick={openWorkspace}>Enter operational workspace <ArrowRight size={17}/></button></aside><div className="docs-list">
        {[
          ['Identifier grammar','CVE-YYYY-NNNN… is required. GHSA and OSV identifiers are optional, normalized and sorted before storage.'],
          ['Possible outcomes','Same vulnerability, related but separate, distinct, or unresolved. Only a supported same result can create or extend one cluster.'],
          ['Objections','A reason code and concise public note create an active guard. If consensus later says “same,” the proposal remains unresolved and no cluster changes.'],
          ['Recovery','After a wallet returns a hash, Tracefold observes that exact transaction. A timeout leads to reconciliation—never automatic resubmission.']
        ].map(([title,body]) => <details key={title}><summary>{title}<span>+</span></summary><p>{body}</p></details>)}
      </div></div></section>
      <section className="closing-cta"><TracefoldMark/><p>From fragmented advisories<br/>to accountable identity.</p><button onClick={openWorkspace}>Open Tracefold <ArrowRight size={18}/></button></section>
    </main>
    <footer className="story-footer"><Brand/><span>Built with GenLayer Intelligent Contracts.</span><div><a href="https://docs.genlayer.com" target="_blank" rel="noreferrer">GenLayer Docs <ExternalLink size={12}/></a><a href="https://nvd.nist.gov" target="_blank" rel="noreferrer">NVD</a><a href="https://osv.dev" target="_blank" rel="noreferrer">OSV</a></div></footer>
  </div>;
};

const Workspace = ({ goHome }: { goHome: () => void }) => {
  const [activeTab,setActiveTab] = useState<TabType>('clusters'); const [targetProposal,setTargetProposal] = useState<number>();
  useEffect(() => { document.title='Workspace — Tracefold'; window.scrollTo(0,0); },[]);
  return <div className="workspace-layer"><button className="workspace-home" onClick={goHome}><TracefoldMark compact/> Back to Tracefold</button><Header/><div className="workspace-intro"><span>OPERATIONAL LAYER</span><h1>Evidence workspace</h1><p>Propose identifiers, observe consensus, inspect history and protect downstream incident actions.</p></div><Navigation activeTab={activeTab} onTabChange={setActiveTab}/><main className="workspace-main">
    {activeTab==='clusters'&&<ClusterExplorer onNavigateToPropose={()=>setActiveTab('propose')}/>} {activeTab==='propose'&&<ProposeAliasSet onSuccessNavigate={()=>setActiveTab('proposals')}/>} {activeTab==='proposals'&&<ProposalAssessmentTracker onNavigateToObjection={(id)=>{setTargetProposal(id);setActiveTab('objections')}}/>} {activeTab==='objections'&&<FileObjection initialProposalId={targetProposal}/>} {activeTab==='consume'&&<IncidentConsumer/>} {activeTab==='evidence'&&<div className="empty-panel"><CheckCircle2/><h2>Verified release</h2><p>Contract <a href="https://explorer-studio-dev.genlayer.com/address/0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D" target="_blank" rel="noreferrer">0x8A9c…d00D</a> is deployed on Studio Dev chain 61997 from source SHA-256 <code>85F6BDC…5DC3B1</code>.</p></div>}
  </main><TransactionModal/><ToastContainer/></div>;
};

const AppContent = () => { const [layer,setLayer]=useState<Layer>(()=>window.location.hash==='#workspace'?'workspace':'story'); const navigate=(next:Layer)=>{window.location.hash=next==='workspace'?'workspace':'top';setLayer(next)}; return layer==='story'?<Landing openWorkspace={()=>navigate('workspace')}/>:<Workspace goHome={()=>navigate('story')}/> };
export const App = () => <WalletProvider><RegistryProvider><AppContent/></RegistryProvider></WalletProvider>;
export default App;
