import { EMOTION_OPTIONS, MISTAKE_OPTIONS } from "../../constants/tradeForm";
import { MistakeType, TradeEmotion } from "../../types/trade";

interface TradePsychologySectionProps {
  readonly emotionBefore: TradeEmotion;
  readonly emotionAfter: TradeEmotion;
  readonly mistakeType: MistakeType;
  readonly confidenceScore: string;
  readonly onEmotionBeforeChange: (value: TradeEmotion) => void;
  readonly onEmotionAfterChange: (value: TradeEmotion) => void;
  readonly onMistakeTypeChange: (value: MistakeType) => void;
  readonly onConfidenceScoreChange: (value: string) => void;
}

export default function TradePsychologySection({
  emotionBefore,
  emotionAfter,
  mistakeType,
  confidenceScore,
  onEmotionBeforeChange,
  onEmotionAfterChange,
  onMistakeTypeChange,
  onConfidenceScoreChange,
}: TradePsychologySectionProps) {
  return (
    <>
      <label>
        Emotion Before Trade
        <select
          value={emotionBefore}
          onChange={(event) =>
            onEmotionBeforeChange(event.target.value as TradeEmotion)
          }
        >
          {EMOTION_OPTIONS.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </label>
      <label>
        Emotion After Trade
        <select
          value={emotionAfter}
          onChange={(event) =>
            onEmotionAfterChange(event.target.value as TradeEmotion)
          }
        >
          {EMOTION_OPTIONS.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mistake Type
        <select
          value={mistakeType}
          onChange={(event) =>
            onMistakeTypeChange(event.target.value as MistakeType)
          }
        >
          {MISTAKE_OPTIONS.map((mistake) => (
            <option key={mistake} value={mistake}>
              {mistake}
            </option>
          ))}
        </select>
      </label>
      <label>
        Confidence (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={confidenceScore}
          onChange={(event) => onConfidenceScoreChange(event.target.value)}
        />
      </label>
    </>
  );
}
