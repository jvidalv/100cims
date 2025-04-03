import React from "react";
import { Linking, Pressable, StyleProp, TextStyle } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "./themed-text";

const urlRegex =
  /((https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/[\w\-._~:\/?#[\]@!$&'()*+,;=]*)?)|([\w._%+-]+@[\w.-]+\.[a-z]{2,})|(\+?(?:\d[\s-]?){6,}\d)/gi;

export const EnrichedThemedText = ({
  children,
  className,
  style,
}: {
  children: string;
  className?: string;
  style?: StyleProp<TextStyle>;
}) => {
  const parts = [...children.matchAll(urlRegex)];

  if (!parts.length) {
    return <ThemedText className={className}>{children}</ThemedText>;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  parts.forEach((match, index) => {
    const matchedText = match[0];
    const start = match.index ?? 0;
    let end = start + matchedText.length;

    let trimmed = matchedText;
    while (/[.,!?)]$/.test(trimmed)) {
      trimmed = trimmed.slice(0, -1);
      end--;
    }

    if (start > lastIndex) {
      elements.push(
        <ThemedText key={`text-${index}`} className={className}>
          {children.slice(lastIndex, start)}
        </ThemedText>,
      );
    }

    let link = trimmed;

    if (match[3]) link = `mailto:${trimmed}`;
    else if (match[4]) link = `tel:${trimmed.replace(/[^\d+]/g, "")}`;
    else if (match[1] && !trimmed.startsWith("http"))
      link = `https://${trimmed}`;

    elements.push(
      <Pressable key={`link-${index}`} onPress={() => Linking.openURL(link)}>
        <ThemedText className="-mb-1 text-blue-500 underline">
          {trimmed}
        </ThemedText>
      </Pressable>,
    );

    lastIndex = end;
  });

  if (lastIndex < children.length) {
    elements.push(
      <ThemedText key="tail" className={className}>
        {children.slice(lastIndex)}
      </ThemedText>,
    );
  }

  return (
    <ThemedText className={twMerge(className)} style={style}>
      {elements}
    </ThemedText>
  );
};
