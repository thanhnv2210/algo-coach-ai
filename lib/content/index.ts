import type { TopicContent } from "@/lib/content/types"
import { topic as arrays }            from "@/lib/content/topics/arrays"
import { topic as strings }           from "@/lib/content/topics/strings"
import { topic as hashMap }           from "@/lib/content/topics/hash-map"
import { topic as slidingWindow }     from "@/lib/content/topics/sliding-window"
import { topic as stack }             from "@/lib/content/topics/stack"
import { topic as queue }             from "@/lib/content/topics/queue"
import { topic as linkedList }        from "@/lib/content/topics/linked-list"
import { topic as tree }              from "@/lib/content/topics/tree"
import { topic as graph }             from "@/lib/content/topics/graph"
import { topic as heap }              from "@/lib/content/topics/heap"
import { topic as binarySearch }      from "@/lib/content/topics/binary-search"
import { topic as backtracking }      from "@/lib/content/topics/backtracking"
import { topic as dynamicProgramming} from "@/lib/content/topics/dynamic-programming"

const ALL_TOPICS: TopicContent[] = [
  arrays,
  strings,
  hashMap,
  slidingWindow,
  stack,
  queue,
  linkedList,
  tree,
  graph,
  heap,
  binarySearch,
  backtracking,
  dynamicProgramming,
].sort((a, b) => a.order - b.order)

export function getAllTopics(): TopicContent[] {
  return ALL_TOPICS
}

export function getTopicBySlug(slug: string): TopicContent | undefined {
  return ALL_TOPICS.find((t) => t.slug === slug)
}

export function getAllSlugs(): string[] {
  return ALL_TOPICS.map((t) => t.slug)
}
