import { useEffect, useState } from 'react';

interface SidebarProps {
    transcript: string;
    summary: string;
    onSectionClick: (id: string) => void;
}

export function Sidebar({ transcript, summary, onSectionClick }: SidebarProps) {
    const [sections, setSections] = useState<{ title: string, id: string }[]>([]);
    const [activeSection, setActiveSection] = useState('key-takeaways');

    useEffect(() => {
        // Add summary section first
        const summarySection = { title: "Key Takeaways", id: "key-takeaways" };

        // Parse markdown headers to create navigation
        const headers = transcript.match(/^##\s+(.+)$/gm) || [];
        const contentSections = headers.map(header => {
            const title = header.replace(/^##\s+/, '');
            const id = title.toLowerCase().replace(/[^\w]+/g, '-');
            return { title, id };
        });

        setSections([summarySection, ...contentSections]);
    }, [transcript]);

    // Add intersection observer to track active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const visibleSections = entries
                            .filter(e => e.isIntersecting)
                            .map(e => e.target.id);

                        if (visibleSections.length > 0) {
                            // Get the first visible section from our ordered sections array
                            const activeId = sections.find(section =>
                                visibleSections.includes(section.id)
                            )?.id;

                            if (activeId) {
                                setActiveSection(activeId);
                            }
                        }
                    }
                });
            },
            {
                rootMargin: '-10% 0px -85% 0px',
                threshold: 0.1
            }
        );

        // Observe all section elements
        sections.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [sections]);

    return (
        <nav className="space-y-0.5">
            {sections.map(section => (
                <button
                    key={section.id}
                    onClick={() => {
                        onSectionClick(section.id);
                        setActiveSection(section.id);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors rounded
                        ${activeSection === section.id
                            ? 'bg-zinc-100/80 text-zinc-900 font-medium'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                >
                    {section.title}
                </button>
            ))}
        </nav>
    );
} 