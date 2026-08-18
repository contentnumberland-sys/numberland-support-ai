export type Channel =
  | "sms"
  | "chat"
  | "ticket"
  | "announcement"
  | "other";

export type AgentStatus =
  | "needs_information"
  | "needs_confirmation"
  | "completed"
  | "error";

export interface Understanding {
  channel: Channel;
  audience: string | null;
  situation: string | null;
  goal: string | null;
  user_action: string | null;
  allowed_information: string[];
  hidden_information: string[];
  required_details: string[];
  constraints: string[];
}

export interface AgentQuestion {
  id: string;
  question: string;
  reason: string;
}

export interface AgentResponse {
  status: AgentStatus;

  understanding: Understanding;

  questions: AgentQuestion[];

  final_message: {
    text: string;
    channel: Channel;
  } | null;

  quality_checks: {
    facts_supported: boolean;
    no_invented_information: boolean;
    hidden_information_respected: boolean;
    brand_voice_ok: boolean;
    writing_style_ok: boolean;
    user_action_clear: boolean;
  };
}

export const agentJsonSchema = {
  type: "object",
  additionalProperties: false,

  required: [
    "status",
    "understanding",
    "questions",
    "final_message",
    "quality_checks",
  ],

  properties: {
    status: {
      type: "string",
      enum: [
        "needs_information",
        "needs_confirmation",
        "completed",
        "error",
      ],
    },

    understanding: {
      type: "object",
      additionalProperties: false,

      required: [
        "channel",
        "audience",
        "situation",
        "goal",
        "user_action",
        "allowed_information",
        "hidden_information",
        "required_details",
        "constraints",
      ],

      properties: {
        channel: {
          type: "string",
          enum: [
            "sms",
            "chat",
            "ticket",
            "announcement",
            "other",
          ],
        },

        audience: {
          type: ["string", "null"],
        },

        situation: {
          type: ["string", "null"],
        },

        goal: {
          type: ["string", "null"],
        },

        user_action: {
          type: ["string", "null"],
        },

        allowed_information: {
          type: "array",
          items: {
            type: "string",
          },
        },

        hidden_information: {
          type: "array",
          items: {
            type: "string",
          },
        },

        required_details: {
          type: "array",
          items: {
            type: "string",
          },
        },

        constraints: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    },

    questions: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        required: [
          "id",
          "question",
          "reason",
        ],

        properties: {
          id: {
            type: "string",
          },

          question: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },
      },
    },

    final_message: {
      anyOf: [
        {
          type: "null",
        },

        {
          type: "object",
          additionalProperties: false,

          required: [
            "text",
            "channel",
          ],

          properties: {
            text: {
              type: "string",
            },

            channel: {
              type: "string",
              enum: [
                "sms",
                "chat",
                "ticket",
                "announcement",
                "other",
              ],
            },
          },
        },
      ],
    },

    quality_checks: {
      type: "object",
      additionalProperties: false,

      required: [
        "facts_supported",
        "no_invented_information",
        "hidden_information_respected",
        "brand_voice_ok",
        "writing_style_ok",
        "user_action_clear",
      ],

      properties: {
        facts_supported: {
          type: "boolean",
        },

        no_invented_information: {
          type: "boolean",
        },

        hidden_information_respected: {
          type: "boolean",
        },

        brand_voice_ok: {
          type: "boolean",
        },

        writing_style_ok: {
          type: "boolean",
        },

        user_action_clear: {
          type: "boolean",
        },
      },
    },
  },
} as const;