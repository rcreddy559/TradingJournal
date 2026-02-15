import {
  NOTES_MAX_LENGTH,
  QUICK_NOTE_TEMPLATES,
} from "../../constants/tradeForm";

interface TradeJournalSectionProps {
  readonly notes: string;
  readonly entryReason: string;
  readonly exitReason: string;
  readonly lessonLearned: string;
  readonly onNotesChange: (value: string) => void;
  readonly onEntryReasonChange: (value: string) => void;
  readonly onExitReasonChange: (value: string) => void;
  readonly onLessonLearnedChange: (value: string) => void;
  readonly onQuickNoteAppend: (snippet: string) => void;
}

export default function TradeJournalSection({
  notes,
  entryReason,
  exitReason,
  lessonLearned,
  onNotesChange,
  onEntryReasonChange,
  onExitReasonChange,
  onLessonLearnedChange,
  onQuickNoteAppend,
}: TradeJournalSectionProps) {
  return (
    <>
      <label className="full-width">
        Entry Reason
        <textarea
          value={entryReason}
          onChange={(event) => onEntryReasonChange(event.target.value)}
          rows={2}
          placeholder="Why did you enter this trade?"
        />
      </label>
      <label className="full-width">
        Exit Reason
        <textarea
          value={exitReason}
          onChange={(event) => onExitReasonChange(event.target.value)}
          rows={2}
          placeholder="Why did you exit this trade?"
        />
      </label>
      <label className="full-width">
        Lesson Learned
        <textarea
          value={lessonLearned}
          onChange={(event) => onLessonLearnedChange(event.target.value)}
          rows={2}
          placeholder="What will you improve next time?"
        />
      </label>

      <div className="full-width quick-note-row">
        {QUICK_NOTE_TEMPLATES.map((snippet) => (
          <button
            key={snippet}
            type="button"
            className="secondary"
            onClick={() => onQuickNoteAppend(snippet)}
          >
            + {snippet.slice(0, 20)}...
          </button>
        ))}
      </div>

      <label className="full-width">
        Notes
        <textarea
          value={notes}
          onChange={(event) =>
            onNotesChange(event.target.value.slice(0, NOTES_MAX_LENGTH))
          }
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          placeholder="Write detailed context, execution quality, and market behavior"
        />
        <span className="char-counter">
          {notes.length}/{NOTES_MAX_LENGTH}
        </span>
      </label>
    </>
  );
}
