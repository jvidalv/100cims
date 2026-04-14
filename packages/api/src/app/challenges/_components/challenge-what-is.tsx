interface Props {
  title: string;
  paragraphs: string[];
}

export const ChallengeWhatIs = ({ title, paragraphs }: Props) => (
  <section className="py-16 px-4">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">{title}</h2>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-lg text-muted-foreground mb-4 leading-relaxed last:mb-0"
        >
          {p}
        </p>
      ))}
    </div>
  </section>
);
