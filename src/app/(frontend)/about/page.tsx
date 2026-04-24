import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import { Separator } from '@/components/ui/separator'
import { History, Users, Target, Rocket, Award, Globe, Zap, Cpu } from 'lucide-react'

export default async function Page() {
  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl">
          BOUT EBED CLUB
        </h1>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20 space-y-16">
          <section className="space-y-4">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Established on 14th November 2018 at PACE.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary tracking-widest uppercase">
                  <History className="w-3 h-3" />
                  Est. 2018
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20 text-xs font-bold text-secondary tracking-widest uppercase">
                  <Globe className="w-3 h-3" />
                  PACE Community
               </div>
            </div>
          </section>

          <Separator className="opacity-20" />

          {/* Objectives Section */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-primary flex items-center gap-3">
              <Target className="w-6 h-6" />
              Our Objectives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Technical Community", desc: "Creating a Community with Infrastructure to help technical Minds." },
                { title: "Knowledge Transfer", desc: "Connecting Experienced and Newbies to transfer Knowledge." },
                { title: "Ideation Hub", desc: "Connecting Like minded Technocrats to generate ideas/product/technologies." },
                { title: "Open Lab", desc: "Creating an Open Lab with Latest Technology Hardware and Tools." }
              ].map((obj, i) => (
                <div key={i} className="p-6 rounded-xl border border-border/50 bg-muted/5 space-y-2">
                  <h3 className="font-bold text-sm uppercase tracking-wide">{obj.title}</h3>
                  <p className="text-sm text-muted-foreground">{obj.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* History & Founding */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              The Team
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Embed Club, founded in 2018, emerged from the collective vision and dedication of its core founding members: 
                <span className="text-foreground font-semibold"> Habeeb Ur Rehman, Nishant Narayanan, and Mohammed Saifuddin.</span>
              </p>
              <p>
                Complementing their efforts are the valuable contributions of student members, including Hashir Abdullah, Mohammed Irfan, Saiful Aseem, Rumaiz Abdullah, Mohammed Shakir, Mohammed Shayiz, and Marzook, who joined between 2018 and 2020.
              </p>
              <p>
                Together, this diverse team of passionate individuals embodies the spirit of innovation and collaboration at the heart of the club's mission. With a focus on advancing knowledge and expertise in embedded systems and IoT, the club provides a dynamic platform for learning, exploration, and creativity.
              </p>
            </div>
          </section>

          {/* The Challenge */}
          <section className="p-8 rounded-2xl bg-primary/5 border border-primary/10 space-y-6">
             <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                The Educational Challenge
             </h2>
             <p className="text-muted-foreground leading-relaxed">
                Embedded system education is an enormous challenge for universities because embedded system is at the intersection of different disciplines and in continuous rapid progress. Outstanding curriculum design will keep students close to the requirements from industry. Embed club is planned and managed by the students themselves, helping them study actively and consciously.
             </p>
          </section>

          {/* Alumni & Growth */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3 text-secondary">
              <Award className="w-6 h-6" />
              Alumni Network
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Alumni play a vital role in fostering the growth of the club by leveraging their industry experience and expertise to train current students in various technologies. Through workshops, mentorship programs, and guest lectures, they share insights that empower students to expand their skills and stay abreast of the latest developments.
            </p>
          </section>

          {/* Goals Detail */}
          <section className="space-y-12">
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Core Goals</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">Mastery through activity</p>
            </div>
            
            <div className="space-y-10">
               <div className="space-y-3">
                  <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                    <span className="text-primary text-xs font-mono">01</span> Sharing experiences
                  </h3>
                  <p className="text-muted-foreground">Students can exchange their experiences and form an embedded technology community where they publish problems and get community help, deepening their understanding.</p>
               </div>
               <div className="space-y-3">
                  <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                    <span className="text-primary text-xs font-mono">02</span> Having more practice
                  </h3>
                  <p className="text-muted-foreground">Teams complete tasks after college hours with help from experienced students and teachers. Excellent students can eventually participate in research groups.</p>
               </div>
               <div className="space-y-3">
                  <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                    <span className="text-primary text-xs font-mono">03</span> Receiving new information
                  </h3>
                  <p className="text-muted-foreground">Supplementing classroom teaching with updates from invited professors, specialists, and senior engineers to stay synced with industry changes.</p>
               </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-muted/10 border border-border/50">
              <h2 className="text-2xl font-bold uppercase mb-4 flex items-center gap-2">
                 <Zap className="w-6 h-6 text-primary" /> Mission
              </h2>
              <p className="text-muted-foreground text-sm uppercase tracking-wide leading-relaxed">
                Advancing knowledge and expertise in embedded systems and IoT by fostering a community of passionate learners and innovators who collaborate and create impact.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-muted/10 border border-border/50">
              <h2 className="text-2xl font-bold uppercase mb-4 flex items-center gap-2">
                 <Rocket className="w-6 h-6 text-secondary" /> Vision
              </h2>
              <p className="text-muted-foreground text-sm uppercase tracking-wide leading-relaxed">
                To be a leading hub for innovation in embedded systems, inspiring and educating the next generation of engineers to shape the future of technology.
              </p>
            </div>
          </div>

          {/* Get Connected */}
          <section className="text-center py-10 space-y-6">
            <h2 className="text-3xl font-black uppercase">Get Connected!</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Embed Club connects over 100+ members who share a passion for innovation. Join us to collaborate on groundbreaking projects and network with professionals.
            </p>
            <div className="pt-4">
              <a href="/contact" className="inline-block px-8 py-3 bg-foreground text-background font-bold rounded-full uppercase tracking-tighter hover:opacity-90 transition-opacity">
                Join Us
              </a>
            </div>
          </section>

          <footer className="text-center border-t border-border pt-10 opacity-20">
             <p className="text-[10px] uppercase font-bold tracking-[0.5em]">Inspiring Innovation Since 2018</p>
          </footer>

        </div>
      </MainbarShell>
    </SidebarShell>
  )
}

// Last update index: 67
