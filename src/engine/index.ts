import { TextToSpeechConverter } from "./tts-converter";
import { SpeechToTextConverter } from "./stt-converter";
import { Assistant } from "./assistant";

export class Engine {
  constructor(
    private readonly tts: TextToSpeechConverter,
    private readonly stt: SpeechToTextConverter,
    private readonly assistant: Assistant,
  ) {}

  public async *process(file: string): AsyncGenerator<string> {
    const text = await this.stt.convert(file);

    for await (const response of this.assistant.chat(text)) {
      yield this.tts.convert(response);
    }
  }
}
