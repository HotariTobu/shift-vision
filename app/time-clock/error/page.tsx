import { Flex, Text, Title } from "@tremor/react"
import isInvalidDate from "@/lib/util/is-invalid-date"
import Link from "next/link"
import ErrorList from "./error-list"
import { Suspense } from "react"

export default (props: {
  searchParams: {
    y?: string
    m?: string
  }
}) => {
  const { y, m } = props.searchParams

  let thisMonth = new Date(
    Number.parseInt(y ?? ''),
    Number.parseInt(m ?? '') - 1,
  )

  if (isInvalidDate(thisMonth)) {
    thisMonth = new Date()
  }

  const year = thisMonth.getFullYear()
  const month = thisMonth.getMonth() + 1

  return (
    <main className="p-12">
      <Title>打刻のズレ一覧</Title>
      <Text>シフトと実際の打刻のズレが日付ごとに表示されます。</Text>

      <Flex className="mt-4">
        {/*
        Linkではstreamingできないバグがあるらしい
        https://github.com/vercel/next.js/issues/49125
        */}
        <a href={`error?y=${year}&m=${month - 1}`}>先月</a>
        {/* <Link href={`error?y=${year}&m=${month - 1}`}>先月</Link> */}
        <Text>{year}年{month}月</Text>
        <a href={`error?y=${year}&m=${month + 1}`}>来月</a>
        {/* <Link href={`error?y=${year}&m=${month + 1}`}>来月</Link> */}
      </Flex>

      <Suspense fallback={<p>Loading...</p>}>
        <ErrorList year={year} month={month} />
      </Suspense>
    </main>
  )
}
