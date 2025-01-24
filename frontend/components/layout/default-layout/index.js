import { useLoader } from '@/hooks/use-loader'
import Header from './header'
import MyFooter from './my-footer'
import Head from 'next/head'

export default function DefaultLayout({ title = 'GuruLaptop', children }) {
  const { loader } = useLoader()

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </Head>
      <Header />
      <main className="flex-shrink-0">
        {children}
        {loader()}
      </main>
      <MyFooter />
    </>
  )
}