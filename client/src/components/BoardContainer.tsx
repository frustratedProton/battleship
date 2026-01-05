import type { ReactNode } from "react";

interface BoardContainerProps {
	title: string;
	children: ReactNode;
}

const BoardContainer = ({ title, children }: BoardContainerProps) => {
	return (
		<div className="flex flex-col items-start p-4 rounded-lg bg-white shadow border-4 border-red-50">
			<h2 className="mb-3 text-lg font-semibold">{title}</h2>
			{children}
		</div>
	);
};

export default BoardContainer;