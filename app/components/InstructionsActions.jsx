'use client';

import Link from 'next/link';

const InstructionsActions = () => {
  return (
    <section className="text-center">
      <Link href="/guess" className="btn btn-primary text-lg px-6 py-3">
        קדימה, למלא טופס! 🎯
      </Link>
    </section>
  );
};

export default InstructionsActions;
